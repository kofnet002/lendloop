import { ConvexError } from "convex/values";
import type { AppErrorData } from "@/convex/lib/errors";

export function errorMessage(error: unknown): string {
  if (error instanceof ConvexError) return (error.data as AppErrorData).message;
  return "Something went wrong. Please try again.";
}
