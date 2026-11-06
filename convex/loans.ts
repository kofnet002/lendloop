import { v } from "convex/values";
import { enqueueLoanEvent } from "./lib/automation";
import { LIMITS } from "./lib/constants";
import { todayISO } from "./lib/dates";
import { fail } from "./lib/errors";
import { userMutation, userQuery } from "./lib/functions";
import {
  findOverlapping,
  LOAN_ACTIONS,
  loadActionableLoan,
  normalizeMessage,
  presentLoans,
  setLoanStatus,
  validateLoanRange,
} from "./lib/loans";
import { requireActiveTool } from "./lib/tools";

const loanArgs = { loanId: v.id("loans") };

export const request = userMutation({
  args: {
    toolId: v.id("tools"),
    startDate: v.string(),
    endDate: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { toolId, startDate, endDate, message }) => {
    const tool = await requireActiveTool(ctx.db, toolId);
    if (tool.ownerId === ctx.viewer._id) fail("FORBIDDEN", "You cannot borrow your own tool.");

    const range = { startDate, endDate };
    validateLoanRange(range, todayISO());

    if ((await findOverlapping(ctx.db, toolId, "approved", range)).length > 0) {
      fail("CONFLICT", "Those dates are already booked.");
    }
    const pending = await findOverlapping(ctx.db, toolId, "requested", range);
    if (pending.some((loan) => loan.borrowerId === ctx.viewer._id)) {
      fail("CONFLICT", "You already have a pending request for these dates.");
    }

    const parties = { ownerId: tool.ownerId, borrowerId: ctx.viewer._id };
    const loanId = await ctx.db.insert("loans", {
      ...parties,
      ...range,
      toolId,
      toolName: tool.name,
      message: normalizeMessage(message),
      status: "requested",
    });
    await enqueueLoanEvent(ctx, { _id: loanId, ...parties }, "requested");
    return loanId;
  },
});

export const approve = userMutation({
  args: loanArgs,
  handler: async (ctx, { loanId }) => {
    const loan = await loadActionableLoan(ctx, loanId, "approve", ctx.viewer);
    if (loan.endDate < todayISO()) fail("CONFLICT", "This request has expired.");
    if ((await findOverlapping(ctx.db, loan.toolId, "approved", loan)).length > 0) {
      fail("CONFLICT", "Another loan is already approved for these dates.");
    }

    await setLoanStatus(ctx, loan, LOAN_ACTIONS.approve.to);
    const competing = await findOverlapping(ctx.db, loan.toolId, "requested", loan);
    for (const other of competing) await setLoanStatus(ctx, other, "declined");
  },
});

export const decline = userMutation({
  args: loanArgs,
  handler: async (ctx, { loanId }) => {
    const loan = await loadActionableLoan(ctx, loanId, "decline", ctx.viewer);
    await setLoanStatus(ctx, loan, LOAN_ACTIONS.decline.to);
  },
});

export const cancel = userMutation({
  args: loanArgs,
  handler: async (ctx, { loanId }) => {
    const loan = await loadActionableLoan(ctx, loanId, "cancel", ctx.viewer);
    await setLoanStatus(ctx, loan, LOAN_ACTIONS.cancel.to);
  },
});

export const markReturned = userMutation({
  args: loanArgs,
  handler: async (ctx, { loanId }) => {
    const loan = await loadActionableLoan(ctx, loanId, "markReturned", ctx.viewer);
    if (loan.startDate > todayISO()) fail("CONFLICT", "This loan has not started yet.");
    await setLoanStatus(ctx, loan, LOAN_ACTIONS.markReturned.to);
  },
});

export const myRequests = userQuery({
  args: {},
  handler: async (ctx) => {
    const viewer = ctx.viewer;
    if (!viewer) return [];
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", viewer._id))
      .order("desc")
      .take(LIMITS.listSize);
    return presentLoans(ctx.db, loans, todayISO());
  },
});

export const incoming = userQuery({
  args: {},
  handler: async (ctx) => {
    const viewer = ctx.viewer;
    if (!viewer) return [];
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_owner", (q) => q.eq("ownerId", viewer._id))
      .order("desc")
      .take(LIMITS.listSize);
    return presentLoans(ctx.db, loans, todayISO());
  },
});
