"use client";

import { LayoutGrid } from "lucide-react";
import type { ToolCategory } from "@/convex/lib/constants";
import { CATEGORY_OPTIONS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { CATEGORY_STYLE } from "./category";

const OPTIONS = [
  { value: undefined, label: "All tools", icon: LayoutGrid },
  ...CATEGORY_OPTIONS.map((option) => ({ ...option, icon: CATEGORY_STYLE[option.value].icon })),
];

export function CategoryFilter({
  value,
  onChange,
}: {
  value: ToolCategory | undefined;
  onChange: (value: ToolCategory | undefined) => void;
}) {
  return (
    <div
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-1 pb-2 [scrollbar-width:none] sm:-mx-1 sm:px-1 lg:flex-wrap"
      role="group"
      aria-label="Filter by category"
    >
      {OPTIONS.map(({ value: optionValue, label, icon: Icon }) => {
        const active = value === optionValue;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(optionValue)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border-2 border-line bg-surface px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted hover:border-ink hover:text-ink",
              active && "press border-ink bg-yellow text-navy hover:text-navy",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
