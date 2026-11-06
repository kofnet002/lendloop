import { v } from "convex/values";
import { internal } from "./_generated/api";
import { LIMITS } from "./lib/constants";
import { todayISO } from "./lib/dates";
import { fail } from "./lib/errors";
import { adminMutation, adminQuery } from "./lib/functions";
import { presentLoans } from "./lib/loans";
import { archiveTool, requireActiveTool } from "./lib/tools";
import { vLoanStatus } from "./lib/validators";

export const loans = adminQuery({
  args: { status: v.optional(vLoanStatus) },
  handler: async (ctx, { status }) => {
    const query = status
      ? ctx.db.query("loans").withIndex("by_status_end", (q) => q.eq("status", status))
      : ctx.db.query("loans");
    const loans = await query.order("desc").take(LIMITS.listSize);
    return presentLoans(ctx.db, loans, todayISO());
  },
});

export const users = adminQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").order("desc").take(LIMITS.listSize);
    return users.map(({ _id, name, email, role, isTrustedLender }) => ({
      _id,
      name,
      email,
      role,
      isTrustedLender,
    }));
  },
});

export const removeTool = adminMutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    const tool = await requireActiveTool(ctx.db, toolId);
    await archiveTool(ctx, tool, ctx.viewer._id);
  },
});

export const setTrustedLender = adminMutation({
  args: { userId: v.id("users"), trusted: v.boolean() },
  handler: async (ctx, { userId, trusted }) => {
    const user = await ctx.db.get(userId);
    if (!user) fail("NOT_FOUND", "User not found.");
    await ctx.db.patch(userId, { isTrustedLender: trusted });
  },
});

export const automationHealth = adminQuery({
  args: {},
  handler: async (ctx) => {
    const [failedEvents, pendingEvents, workflowFailures] = await Promise.all([
      ctx.db
        .query("automationEvents")
        .withIndex("by_status", (q) => q.eq("status", "failed"))
        .order("desc")
        .take(50),
      ctx.db
        .query("automationEvents")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(50),
      ctx.db.query("automationFailures").order("desc").take(50),
    ]);
    return { failedEvents, pendingCount: pendingEvents.length, workflowFailures };
  },
});

export const retryAutomationEvent = adminMutation({
  args: { eventId: v.id("automationEvents") },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) fail("NOT_FOUND", "Automation event not found.");
    if (event.kind !== "loan_notification" || event.status !== "failed") {
      fail("CONFLICT", "Only failed loan notifications can be retried from here.");
    }
    await ctx.db.patch(eventId, {
      status: "pending",
      attempts: 0,
      lastError: undefined,
      completedAt: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.automation.deliverLoanEvent, { eventId });
  },
});
