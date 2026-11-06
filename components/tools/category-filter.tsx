"use client";

import type { ToolCategory } from "@/convex/lib/constants";
import { CATEGORY_OPTIONS } from "@/lib/labels";
import { cn } from "@/lib/utils";

const OPTIONS = [{ value: undefined, label: "All" }, ...CATEGORY_OPTIONS];

export function CategoryFilter({
  value,
  onChange,
}: {
  value: ToolCategory | undefined;
  onChange: (value: ToolCategory | undefined) => void;
}) {
  return (
    <div
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      role="group"
      aria-label="Filter by category"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border border-border px-3 py-1 text-sm whitespace-nowrap text-muted hover:text-foreground",
            value === option.value &&
              "border-accent bg-accent text-accent-foreground hover:text-accent-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
