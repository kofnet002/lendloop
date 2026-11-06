import { ConvexError } from "convex/values";

export type ErrorCode =
  "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID_INPUT" | "CONFLICT";

export type AppErrorData = { code: ErrorCode; message: string };

export function fail(code: ErrorCode, message: string): never {
  throw new ConvexError<AppErrorData>({ code, message });
}
