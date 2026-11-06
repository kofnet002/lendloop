import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A tag hanging from a peg: string and eyelet above, clipped tag body below. */
export function HangTag({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="group relative pt-4">
      <span
        className="absolute top-0 left-1/2 z-10 size-3 -translate-x-1/2 rounded-full bg-ink ring-[3px] ring-paper"
        aria-hidden
      />
      <span
        className="absolute top-2 left-1/2 z-10 h-6 w-0.5 -translate-x-1/2 bg-ink/70"
        aria-hidden
      />
      <div className="tag-shadow h-full transition-transform duration-300 group-hover:-translate-y-1">
        <div className={cn("hang-tag h-full bg-surface", className)}>{children}</div>
      </div>
    </div>
  );
}
