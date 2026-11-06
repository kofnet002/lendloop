import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import {
  findEventByKey,
  type LoanEventPayload,
  nextRetryDelay,
  reminderKey,
  truncateError,
} from "./lib/automation";
import { AUTOMATION, LIMITS } from "./lib/constants";
import { daysBetween, isISODate, todayISO } from "./lib/dates";
import { fail } from "./lib/errors";
import { signedHeaders } from "./lib/signature";

type DeliveryResult =
  { ok: true; channel?: string } | { ok: false; retryable: boolean; error: string };

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 413, 422]);

export const loanEventPayload = internalQuery({
  args: { eventId: v.id("automationEvents") },
  handler: async (ctx, { eventId }): Promise<LoanEventPayload | null> => {
    const event = await ctx.db.get(eventId);
    if (!event || event.status !== "pending" || !event.eventType) return null;
    const [loan, recipient] = await Promise.all([
      ctx.db.get(event.loanId),
      ctx.db.get(event.recipientId),
    ]);
    if (!loan || !recipient) return null;
    return {
      id: event.idempotencyKey,
      type: event.eventType,
      occurredAt: new Date(event._creationTime).toISOString(),
      loan: {
        id: loan._id,
        toolName: loan.toolName,
        startDate: loan.startDate,
        endDate: loan.endDate,
      },
      recipient: { name: recipient.name, email: recipient.email ?? null },
    };
  },
});

async function postToN8n(payload: LoanEventPayload): Promise<DeliveryResult> {
  const url = process.env.N8N_LOAN_EVENTS_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!url || !secret) {
    return { ok: false, retryable: false, error: "n8n webhook URL or secret is not configured" };
  }

  const body = JSON.stringify(payload);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-lendloop-event-id": payload.id,
        ...(await signedHeaders(secret, body)),
      },
      body,
      signal: AbortSignal.timeout(AUTOMATION.requestTimeoutMs),
    });
    if (response.ok) {
      const result = (await response.json().catch(() => ({}))) as { channel?: unknown };
      return { ok: true, channel: typeof result.channel === "string" ? result.channel : undefined };
    }
    return {
      ok: false,
      retryable: !NON_RETRYABLE_STATUSES.has(response.status),
      error: `n8n responded with HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      retryable: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const deliverLoanEvent = internalAction({
  args: { eventId: v.id("automationEvents") },
  handler: async (ctx, { eventId }) => {
    const payload = await ctx.runQuery(internal.automation.loanEventPayload, { eventId });
    if (!payload) return;
    const result = await postToN8n(payload);
    await ctx.runMutation(internal.automation.recordDeliveryAttempt, { eventId, result });
  },
});

export const recordDeliveryAttempt = internalMutation({
  args: {
    eventId: v.id("automationEvents"),
    result: v.union(
      v.object({ ok: v.literal(true), channel: v.optional(v.string()) }),
      v.object({ ok: v.literal(false), retryable: v.boolean(), error: v.string() }),
    ),
  },
  handler: async (ctx, { eventId, result }) => {
    const event = await ctx.db.get(eventId);
    if (!event || event.status !== "pending") return;
    const attempts = event.attempts + 1;

    if (result.ok) {
      await ctx.db.patch(eventId, {
        status: "sent",
        attempts,
        channel: result.channel,
        lastError: undefined,
        completedAt: Date.now(),
      });
      return;
    }

    const lastError = truncateError(result.error);
    const delay = result.retryable ? nextRetryDelay(attempts) : null;
    if (delay === null) {
      console.error(`Automation event ${event.idempotencyKey} failed permanently: ${lastError}`);
      await ctx.db.patch(eventId, {
        status: "failed",
        attempts,
        lastError,
        completedAt: Date.now(),
      });
      return;
    }

    console.warn(
      `Automation event ${event.idempotencyKey} attempt ${attempts} failed: ${lastError}`,
    );
    await ctx.db.patch(eventId, { attempts, lastError });
    await ctx.scheduler.runAfter(delay, internal.automation.deliverLoanEvent, { eventId });
  },
});

export const overdueLoans = internalQuery({
  args: {},
  handler: async (ctx) => {
    const today = todayISO();
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_status_end", (q) => q.eq("status", "approved").lt("endDate", today))
      .take(LIMITS.listSize);

    const due = await Promise.all(
      loans.map(async (loan) => {
        const key = reminderKey(loan._id, today);
        const existing = await findEventByKey(ctx.db, key);
        if (existing?.status === "sent") return null;
        const borrower = await ctx.db.get(loan.borrowerId);
        if (!borrower) return null;
        return {
          loanId: loan._id,
          reminderKey: key,
          toolName: loan.toolName,
          endDate: loan.endDate,
          daysOverdue: daysBetween(loan.endDate, today),
          borrower: { name: borrower.name, email: borrower.email ?? null },
        };
      }),
    );
    return { asOf: today, loans: due.filter((loan) => loan !== null) };
  },
});

export const reminderReport = {
  reminderKey: v.string(),
  loanId: v.id("loans"),
  status: v.union(v.literal("sent"), v.literal("failed")),
  channel: v.string(),
  error: v.optional(v.string()),
};

/** Idempotent on `reminderKey` (one per loan per day): retries update, never duplicate, and never downgrade a sent reminder. */
export const recordReminder = internalMutation({
  args: reminderReport,
  handler: async (ctx, { reminderKey: key, loanId, status, channel, error }) => {
    const [prefix, keyLoanId, date] = key.split(":");
    if (prefix !== "overdue" || keyLoanId !== loanId || !isISODate(date ?? "")) {
      fail("INVALID_INPUT", "reminderKey does not match loanId.");
    }
    const loan = await ctx.db.get(loanId);
    if (!loan) fail("NOT_FOUND", "Loan not found.");

    const fields = {
      status,
      channel,
      lastError: error ? truncateError(error) : undefined,
      completedAt: Date.now(),
    };
    const existing = await findEventByKey(ctx.db, key);
    if (existing) {
      if (existing.status === "sent") return "unchanged" as const;
      await ctx.db.patch(existing._id, { ...fields, attempts: existing.attempts + 1 });
      return "updated" as const;
    }
    await ctx.db.insert("automationEvents", {
      ...fields,
      loanId,
      kind: "overdue_reminder",
      idempotencyKey: key,
      recipientId: loan.borrowerId,
      attempts: 1,
    });
    return "created" as const;
  },
});

export const failureReport = {
  workflow: v.string(),
  executionId: v.string(),
  node: v.optional(v.string()),
  message: v.string(),
};

export const recordFailure = internalMutation({
  args: failureReport,
  handler: async (ctx, { workflow, executionId, node, message }) => {
    const idempotencyKey = `${workflow}:${executionId}`;
    const existing = await ctx.db
      .query("automationFailures")
      .withIndex("by_key", (q) => q.eq("idempotencyKey", idempotencyKey))
      .unique();
    if (existing) return "unchanged" as const;
    console.error(`n8n workflow "${workflow}" failed at ${node ?? "unknown node"}: ${message}`);
    await ctx.db.insert("automationFailures", {
      idempotencyKey,
      workflow,
      executionId,
      node,
      message: truncateError(message),
    });
    return "created" as const;
  },
});
