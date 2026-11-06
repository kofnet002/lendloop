"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useViewer() {
  const viewer = useQuery(api.users.me);
  return { viewer, isAdmin: viewer?.role === "admin", isLoading: viewer === undefined };
}
