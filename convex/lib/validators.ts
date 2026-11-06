import { literals } from "convex-helpers/validators";
import { LOAN_STATUSES, ROLES, TOOL_CATEGORIES, TOOL_CONDITIONS } from "./constants";

export const vRole = literals(...ROLES);
export const vToolCategory = literals(...TOOL_CATEGORIES);
export const vToolCondition = literals(...TOOL_CONDITIONS);
export const vLoanStatus = literals(...LOAN_STATUSES);
