import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  vAutomationKind,
  vDeliveryStatus,
  vLoanEventType,
  vLoanStatus,
  vRole,
  vToolCategory,
  vToolCondition,
} from "./lib/validators";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    role: vRole,
    isTrustedLender: v.boolean(),
  }).index("by_token", ["tokenIdentifier"]),

  tools: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    category: vToolCategory,
    condition: vToolCondition,
    description: v.string(),
    removedAt: v.optional(v.number()),
    removedBy: v.optional(v.id("users")),
  })
    .index("by_removed_category", ["removedAt", "category"])
    .index("by_owner_removed", ["ownerId", "removedAt"]),

  loans: defineTable({
    toolId: v.id("tools"),
    toolName: v.string(),
    ownerId: v.id("users"),
    borrowerId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
    message: v.optional(v.string()),
    status: vLoanStatus,
    decidedAt: v.optional(v.number()),
    returnedAt: v.optional(v.number()),
  })
    .index("by_tool_status", ["toolId", "status"])
    .index("by_owner", ["ownerId"])
    .index("by_borrower", ["borrowerId"])
    .index("by_status_end", ["status", "endDate"]),

  automationEvents: defineTable({
    loanId: v.id("loans"),
    kind: vAutomationKind,
    idempotencyKey: v.string(),
    eventType: v.optional(vLoanEventType),
    recipientId: v.id("users"),
    status: vDeliveryStatus,
    attempts: v.number(),
    channel: v.optional(v.string()),
    lastError: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  })
    .index("by_key", ["idempotencyKey"])
    .index("by_loan", ["loanId"])
    .index("by_status", ["status"]),

  automationFailures: defineTable({
    idempotencyKey: v.string(),
    workflow: v.string(),
    executionId: v.optional(v.string()),
    node: v.optional(v.string()),
    message: v.string(),
  }).index("by_key", ["idempotencyKey"]),
});
