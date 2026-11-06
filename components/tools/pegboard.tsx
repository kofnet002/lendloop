"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { CATEGORY_LABELS } from "@/lib/labels";
import { cssVars } from "@/lib/utils";
import { ToolArt } from "./category";

const MAX_TAGS = 8;
const TILTS = [-4, 3, -2, 5, -5, 2, -3, 4];

type PegProps = { index: number; children: React.ReactNode };

function Peg({ index, children }: PegProps) {
  const style = cssVars({
    "--tilt": `${TILTS[index % TILTS.length]}deg`,
    "--delay": `${index * 70}ms`,
    "--sway": `${4 + (index % 3) * 0.8}s`,
  });

  return (
    <li className="peg-tag relative pt-5" style={style}>
      <span
        className="absolute top-0 left-1/2 size-3 -translate-x-1/2 rounded-full bg-[#4a3520] ring-2 ring-[#d9b98f]"
        aria-hidden
      />
      <span
        className="absolute top-2 left-1/2 h-8 w-px -translate-x-1/2 bg-[#2a1d10]/70"
        aria-hidden
      />
      <div className="tag-shadow">
        <div className="hang-tag min-h-36 bg-surface">{children}</div>
      </div>
    </li>
  );
}

/** The public catalogue rendered as tags hanging from a neighborhood pegboard. */
export function Pegboard() {
  const tools = useQuery(api.tools.listPublic);
  const shown = tools?.slice(0, MAX_TAGS) ?? [];
  const remaining = (tools?.length ?? 0) - shown.length;

  return (
    <section
      aria-labelledby="pegboard-heading"
      className="pegboard relative overflow-hidden rounded-2xl border-4 border-[#8e6638] p-5 shadow-[inset_0_2px_12px_rgb(0_0_0/0.25)] sm:p-7"
    >
      <h2 id="pegboard-heading" className="sr-only">
        Tools available right now
      </h2>

      {tools === undefined ? (
        <div className="h-72" aria-busy="true" aria-label="Loading tools" />
      ) : tools.length === 0 ? (
        <ul className="grid place-items-center py-6">
          <Peg index={0}>
            <ToolArt category="other" compact className="h-16" />
            <div className="grid gap-1 p-3 text-center">
              <p className="font-display text-xl font-bold tracking-tight">This peg is free</p>
              <p className="text-xs text-muted">List the first tool in your neighborhood.</p>
            </div>
          </Peg>
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((tool, index) => (
            <Peg key={tool._id} index={index}>
              <ToolArt category={tool.category} compact className="h-16" />
              <div className="grid gap-0.5 px-3 pt-2.5 pb-3 text-center">
                <p className="font-display text-lg leading-tight font-bold tracking-tight">
                  {tool.name}
                </p>
                <p className="text-xs text-muted">{CATEGORY_LABELS[tool.category]}</p>
              </div>
            </Peg>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <Link
          href="/board"
          className="absolute right-4 bottom-3 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-chalk hover:bg-ink"
        >
          {remaining} more on the board
        </Link>
      )}
    </section>
  );
}
