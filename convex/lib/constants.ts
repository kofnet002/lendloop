export const TOOL_CATEGORIES = [
  "power_tools",
  "hand_tools",
  "garden",
  "kitchen",
  "camping",
  "cleaning",
  "ladders",
  "other",
] as const;

export const TOOL_CONDITIONS = ["like_new", "good", "fair", "worn"] as const;

export const LOAN_STATUSES = [
  "requested",
  "approved",
  "declined",
  "cancelled",
  "returned",
] as const;

export const ROLES = ["admin", "user"] as const;

export const LIMITS = {
  toolName: { min: 2, max: 80 },
  toolDescription: { max: 500 },
  loanMessage: { max: 280 },
  maxLoanDays: 14,
  maxAdvanceDays: 90,
  listSize: 200,
} as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];
export type ToolCondition = (typeof TOOL_CONDITIONS)[number];
export type LoanStatus = (typeof LOAN_STATUSES)[number];
export type Role = (typeof ROLES)[number];
