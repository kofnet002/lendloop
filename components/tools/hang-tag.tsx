import type { ReactNode } from "react";
import { cn, cssVars } from "@/lib/utils";

const STAGGER_MS = 50;
const MAX_STAGGERED = 9;

/** A tag hanging from a peg: string and eyelet above, clipped tag body below. */
export function HangTag({
  className,
  index = 0,
  children,
}: {
  className?: string;
  index?: number;
  children: ReactNode;
}) {
  return (
    <div
      style={cssVars({ "--delay": `${Math.min(index, MAX_STAGGERED) * STAGGER_MS}ms` })}
      className="rise group relative pt-4"
    >
      <span
        className="absolute top-0 left-1/2 z-10 size-3 -translate-x-1/2 rounded-full bg-ink ring-[3px] ring-paper"
        aria-hidden
      />
      <span
        className="absolute top-2 left-1/2 z-10 h-6 w-0.5 -translate-x-1/2 bg-ink/70"
        aria-hidden
      />
      <div className="swing-on-hover tag-shadow h-full">
        <div className={cn("hang-tag h-full bg-surface", className)}>{children}</div>
      </div>
    </div>
  );
}
