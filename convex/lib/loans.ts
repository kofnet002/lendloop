import type { Doc, Id } from "../_generated/dataModel";
import type { DatabaseReader, MutationCtx } from "../_generated/server";
import { LIMITS, type LoanStatus } from "./constants";
import { addDays, daysBetween, isISODate, rangesOverlap, type DateRange } from "./dates";
import { fail } from "./errors";
import { loadUsers, publicProfile } from "./users";

type LoanActionSpec = { from: LoanStatus; to: LoanStatus; actor: "ownerId" | "borrowerId" };

export const LOAN_ACTIONS = {
  approve: { from: "requested", to: "approved", actor: "ownerId" },
  decline: { from: "requested", to: "declined", actor: "ownerId" },
  cancel: { from: "requested", to: "cancelled", actor: "borrowerId" },
  markReturned: { from: "approved", to: "returned", actor: "ownerId" },
} as const satisfies Record<string, LoanActionSpec>;

export type LoanAction = keyof typeof LOAN_ACTIONS;

export function isOverdue(loan: Doc<"loans">, today: string): boolean {
  return loan.status === "approved" && loan.endDate < today;
}

export function validateLoanRange(range: DateRange, today: string): void {
  if (!isISODate(range.startDate) || !isISODate(range.endDate)) {
    fail("INVALID_INPUT", "Dates must be valid calendar dates.");
  }
  if (range.startDate < today) fail("INVALID_INPUT", "Start date cannot be in the past.");
  if (range.endDate < range.startDate) fail("INVALID_INPUT", "End date must be after start date.");
  if (daysBetween(range.startDate, range.endDate) + 1 > LIMITS.maxLoanDays) {
    fail("INVALID_INPUT", `Loans can last at most ${LIMITS.maxLoanDays} days.`);
  }
  if (range.startDate > addDays(today, LIMITS.maxAdvanceDays)) {
    fail("INVALID_INPUT", `Requests can be made at most ${LIMITS.maxAdvanceDays} days ahead.`);
  }
}

export function normalizeMessage(message: string | undefined): string | undefined {
  const trimmed = message?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > LIMITS.loanMessage.max) {
    fail("INVALID_INPUT", `Message must be at most ${LIMITS.loanMessage.max} characters.`);
  }
  return trimmed;
}

export async function findOverlapping(
  db: DatabaseReader,
  toolId: Id<"tools">,
  status: LoanStatus,
  range: DateRange,
): Promise<Doc<"loans">[]> {
  const loans = await db
    .query("loans")
    .withIndex("by_tool_status", (q) => q.eq("toolId", toolId).eq("status", status))
    .collect();
  return loans.filter((loan) => rangesOverlap(loan, range));
}

/** Single write path for loan state so side effects (timestamps, automation) stay consistent. */
export async function setLoanStatus(
  ctx: MutationCtx,
  loan: Doc<"loans">,
  status: LoanStatus,
): Promise<void> {
  const now = Date.now();
  await ctx.db.patch(
    loan._id,
    status === "returned" ? { status, returnedAt: now } : { status, decidedAt: now },
  );
}

export async function loadActionableLoan(
  ctx: MutationCtx,
  loanId: Id<"loans">,
  action: LoanAction,
  viewer: Doc<"users">,
): Promise<Doc<"loans">> {
  const loan = await ctx.db.get(loanId);
  const spec = LOAN_ACTIONS[action];
  if (!loan || (loan.ownerId !== viewer._id && loan.borrowerId !== viewer._id)) {
    fail("NOT_FOUND", "Loan not found.");
  }
  if (loan[spec.actor] !== viewer._id)
    fail("FORBIDDEN", "You cannot perform this action on this loan.");
  if (loan.status !== spec.from) fail("CONFLICT", `This loan is already ${loan.status}.`);
  return loan;
}

export async function presentLoans(db: DatabaseReader, loans: Doc<"loans">[], today: string) {
  const users = await loadUsers(
    db,
    loans.flatMap((loan) => [loan.ownerId, loan.borrowerId]),
  );
  return loans.map((loan) => ({
    ...loan,
    isOverdue: isOverdue(loan, today),
    owner: publicProfile(users.get(loan.ownerId)),
    borrower: publicProfile(users.get(loan.borrowerId)),
  }));
}
