"use client";

import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/layout/logo-mark";
import { api } from "@/convex/_generated/api";
import { useCountUp } from "@/hooks/use-count-up";

function Stat({ value, label }: { value: number | undefined; label: string }) {
  const shown = useCountUp(value ?? 0);
  return (
    <div className="grid gap-0.5 rounded-2xl bg-chalk/8 px-4 py-3 ring-1 ring-chalk/15">
      <span className="neon-text font-numeric text-4xl leading-none font-extrabold text-yellow tabular-nums">
        {value === undefined ? "–" : shown}
      </span>
      <span className="text-xs text-chalk/70">{label}</span>
    </div>
  );
}

/** The board's masthead: a greeting, the viewer's own loop at a glance, and the search box. */
export function LoopSummary({
  title,
  readyCount,
  children,
}: {
  title: string;
  readyCount: number | undefined;
  children: ReactNode;
}) {
  const incoming = useQuery(api.loans.incoming);
  const borrowed = useQuery(api.loans.myRequests);
  const lendingOut = incoming?.filter((loan) => loan.status === "approved").length;
  const borrowing = borrowed?.filter((loan) => loan.status === "approved").length;

  return (
    <section className="neon-backdrop relative isolate overflow-hidden rounded-3xl px-5 py-7 text-chalk shadow-[0_4px_0_var(--yellow)] sm:px-8">
      <LogoMark
        className="drift absolute -top-16 -right-16 -z-10 size-72 text-chalk opacity-15 sm:size-96"
        loopClassName="neon"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-4">
          <div className="grid gap-1">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            <p className="text-chalk/70">What are you fixing, growing or cooking this week?</p>
          </div>
          {children}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat value={readyCount} label="Ready to borrow" />
          <Stat value={lendingOut} label="You're lending" />
          <Stat value={borrowing} label="You're borrowing" />
        </div>
      </div>
    </section>
  );
}
