import type { BadgeTone } from "@/components/ui/badge";
import {
  TOOL_CATEGORIES,
  TOOL_CONDITIONS,
  type LoanEventType,
  type LoanStatus,
  type ToolCategory,
  type ToolCondition,
} from "@/convex/lib/constants";

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  power_tools: "Power tools",
  hand_tools: "Hand tools",
  garden: "Garden",
  kitchen: "Kitchen",
  camping: "Camping",
  cleaning: "Cleaning",
  ladders: "Ladders",
  other: "Other",
};

export const CONDITION_LABELS: Record<ToolCondition, string> = {
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
  worn: "Worn",
};

export const LOAN_STATUS: Record<LoanStatus | "overdue", { label: string; tone: BadgeTone }> = {
  requested: { label: "Pending", tone: "warning" },
  approved: { label: "On loan", tone: "info" },
  overdue: { label: "Overdue", tone: "danger" },
  declined: { label: "Declined", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  returned: { label: "Returned", tone: "success" },
};

export const EVENT_LABELS: Record<LoanEventType, string> = {
  "loan.requested": "Request alert to lender",
  "loan.approved": "Approval notice to borrower",
  "loan.declined": "Decline notice to borrower",
  "loan.cancelled": "Cancellation notice to lender",
  "loan.returned": "Return confirmation to borrower",
};

export const CATEGORY_OPTIONS = TOOL_CATEGORIES.map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

export const CONDITION_OPTIONS = TOOL_CONDITIONS.map((value) => ({
  value,
  label: CONDITION_LABELS[value],
}));
