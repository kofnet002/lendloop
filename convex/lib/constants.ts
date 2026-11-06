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

export const AUTOMATION_KINDS = ["loan_notification", "overdue_reminder"] as const;
export const DELIVERY_STATUSES = ["pending", "sent", "failed"] as const;
export const LOAN_EVENT_TYPES = [
  "loan.requested",
  "loan.approved",
  "loan.declined",
  "loan.cancelled",
  "loan.returned",
] as const;

export const AUTOMATION = {
  maxAttempts: 5,
  retryDelaysMs: [10_000, 60_000, 300_000, 1_800_000],
  requestTimeoutMs: 10_000,
  signatureToleranceMs: 300_000,
  maxErrorLength: 500,
} as const;

export type AutomationKind = (typeof AUTOMATION_KINDS)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export type LoanEventType = (typeof LOAN_EVENT_TYPES)[number];
