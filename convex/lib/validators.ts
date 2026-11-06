import { literals } from "convex-helpers/validators";
import {
  AUTOMATION_KINDS,
  DELIVERY_STATUSES,
  LOAN_EVENT_TYPES,
  LOAN_STATUSES,
  ROLES,
  TOOL_CATEGORIES,
  TOOL_CONDITIONS,
} from "./constants";

export const vRole = literals(...ROLES);
export const vToolCategory = literals(...TOOL_CATEGORIES);
export const vToolCondition = literals(...TOOL_CONDITIONS);
export const vLoanStatus = literals(...LOAN_STATUSES);
export const vAutomationKind = literals(...AUTOMATION_KINDS);
export const vDeliveryStatus = literals(...DELIVERY_STATUSES);
export const vLoanEventType = literals(...LOAN_EVENT_TYPES);
