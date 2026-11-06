import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { DatabaseReader, MutationCtx } from "../_generated/server";
import { AUTOMATION, type LoanEventType, type LoanStatus } from "./constants";

type Party = "ownerId" | "borrowerId";

const LOAN_EVENTS: Record<LoanStatus, { type: LoanEventType; recipient: Party }> = {
  requested: { type: "loan.requested", recipient: "ownerId" },
  approved: { type: "loan.approved", recipient: "borrowerId" },
  declined: { type: "loan.declined", recipient: "borrowerId" },
  cancelled: { type: "loan.cancelled", recipient: "ownerId" },
  returned: { type: "loan.returned", recipient: "borrowerId" },
};

/** Minimal contract sent to n8n: only what is needed to compose one notification. */
export type LoanEventPayload = {
  id: string;
  type: LoanEventType;
  occurredAt: string;
  loan: { id: Id<"loans">; toolName: string; startDate: string; endDate: string };
  recipient: { name: string; email: string | null };
};

export function loanEventKey(loanId: Id<"loans">, status: LoanStatus): string {
  return `loan:${loanId}:${status}`;
}

export function reminderKey(loanId: Id<"loans">, date: string): string {
  return `overdue:${loanId}:${date}`;
}

export function findEventByKey(db: DatabaseReader, idempotencyKey: string) {
  return db
    .query("automationEvents")
    .withIndex("by_key", (q) => q.eq("idempotencyKey", idempotencyKey))
    .unique();
}

/** Transactional outbox: the event is stored with the state change and delivered asynchronously. */
export async function enqueueLoanEvent(
  ctx: MutationCtx,
  loan: Pick<Doc<"loans">, "_id" | Party>,
  status: LoanStatus,
): Promise<void> {
  const idempotencyKey = loanEventKey(loan._id, status);
  if (await findEventByKey(ctx.db, idempotencyKey)) return;

  const { type, recipient } = LOAN_EVENTS[status];
  const eventId = await ctx.db.insert("automationEvents", {
    loanId: loan._id,
    kind: "loan_notification",
    idempotencyKey,
    eventType: type,
    recipientId: loan[recipient],
    status: "pending",
    attempts: 0,
  });
  await ctx.scheduler.runAfter(0, internal.automation.deliverLoanEvent, { eventId });
}

export function nextRetryDelay(attempts: number): number | null {
  if (attempts >= AUTOMATION.maxAttempts) return null;
  const delays = AUTOMATION.retryDelaysMs;
  return delays[Math.min(attempts, delays.length) - 1];
}

export function truncateError(message: string): string {
  return message.slice(0, AUTOMATION.maxErrorLength);
}

export async function loanActivity(db: DatabaseReader, loanId: Id<"loans">) {
  const events = await db
    .query("automationEvents")
    .withIndex("by_loan", (q) => q.eq("loanId", loanId))
    .order("desc")
    .take(5);
  return events.map((event) => ({
    _id: event._id,
    kind: event.kind,
    eventType: event.eventType,
    status: event.status,
    channel: event.channel,
    at: event.completedAt ?? event._creationTime,
  }));
}
