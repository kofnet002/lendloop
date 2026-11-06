"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/errors";

/** Runs a mutation with a per-key pending flag and consistent success/error toasts. */
export function useAsyncAction() {
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const run = useCallback(async (key: string, action: () => Promise<unknown>, success?: string) => {
    setPendingKey(key);
    try {
      await action();
      if (success) toast.success(success);
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    } finally {
      setPendingKey(null);
    }
  }, []);

  return { run, isPending: (key: string) => pendingKey === key, busy: pendingKey !== null };
}
