import type { Doc, Id } from "../_generated/dataModel";
import type { DatabaseReader, MutationCtx } from "../_generated/server";
import { LIMITS, type ToolCategory, type ToolCondition } from "./constants";
import type { DateRange } from "./dates";
import { fail } from "./errors";
import { setLoanStatus } from "./loans";

export type ToolInput = {
  name: string;
  category: ToolCategory;
  condition: ToolCondition;
  description: string;
};

export type Availability = {
  state: "available" | "on_loan" | "overdue";
  dueDate?: string;
  bookedRanges: DateRange[];
};

export function normalizeToolInput(input: ToolInput): ToolInput {
  const name = input.name.trim();
  const description = input.description.trim();
  if (name.length < LIMITS.toolName.min || name.length > LIMITS.toolName.max) {
    fail("INVALID_INPUT", `Name must be ${LIMITS.toolName.min}–${LIMITS.toolName.max} characters.`);
  }
  if (description.length > LIMITS.toolDescription.max) {
    fail("INVALID_INPUT", `Description must be at most ${LIMITS.toolDescription.max} characters.`);
  }
  return { ...input, name, description };
}

export function activeTools(db: DatabaseReader, category?: ToolCategory) {
  return db
    .query("tools")
    .withIndex("by_removed_category", (q) =>
      category
        ? q.eq("removedAt", undefined).eq("category", category)
        : q.eq("removedAt", undefined),
    )
    .order("desc");
}

export async function requireActiveTool(db: DatabaseReader, toolId: Id<"tools">) {
  const tool = await db.get(toolId);
  if (!tool || tool.removedAt !== undefined) fail("NOT_FOUND", "This tool is no longer listed.");
  return tool;
}

export function approvedLoans(db: DatabaseReader, toolId: Id<"tools">) {
  return db
    .query("loans")
    .withIndex("by_tool_status", (q) => q.eq("toolId", toolId).eq("status", "approved"))
    .collect();
}

export function pendingLoans(db: DatabaseReader, toolId: Id<"tools">) {
  return db
    .query("loans")
    .withIndex("by_tool_status", (q) => q.eq("toolId", toolId).eq("status", "requested"))
    .collect();
}

export async function getAvailability(
  db: DatabaseReader,
  toolId: Id<"tools">,
  today: string,
): Promise<Availability> {
  const approved = await approvedLoans(db, toolId);
  const bookedRanges = approved
    .filter((loan) => loan.endDate >= today)
    .map(({ startDate, endDate }) => ({ startDate, endDate }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const current = approved.find((loan) => loan.startDate <= today);

  if (!current) return { state: "available", bookedRanges };
  return {
    state: current.endDate < today ? "overdue" : "on_loan",
    dueDate: current.endDate,
    bookedRanges,
  };
}

/** Soft-deletes a listing so loan history stays intact; open requests are declined. */
export async function archiveTool(ctx: MutationCtx, tool: Doc<"tools">, actorId: Id<"users">) {
  await ctx.db.patch(tool._id, { removedAt: Date.now(), removedBy: actorId });
  for (const loan of await pendingLoans(ctx.db, tool._id)) {
    await setLoanStatus(ctx, loan, "declined");
  }
}
