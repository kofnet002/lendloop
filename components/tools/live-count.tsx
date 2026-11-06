"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCountUp } from "@/hooks/use-count-up";

/** Live count of available tools; Convex pushes changes, so the number moves as neighbors list and borrow. */
export function LiveCount() {
  const tools = useQuery(api.tools.listPublic);
  const count = useCountUp(tools?.length ?? 0);

  return (
    <p className="flex w-fit items-center gap-2.5 rounded-full border-2 border-ink bg-surface py-1 pr-4 pl-3 text-sm font-medium shadow-[0_3px_0_var(--ink)]">
      <span className="live-dot relative size-2.5 rounded-full bg-stamp-green" aria-hidden />
      {tools === undefined ? (
        "Checking the pegs…"
      ) : (
        <span>
          <span className="font-numeric text-lg leading-none font-extrabold tabular-nums">
            {count}
          </span>{" "}
          {tools.length === 1 ? "tool" : "tools"} ready to borrow right now
        </span>
      )}
    </p>
  );
}
