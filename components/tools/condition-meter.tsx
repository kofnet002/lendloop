import type { ToolCondition } from "@/convex/lib/constants";
import { CONDITION_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

const RANK: Record<ToolCondition, number> = { worn: 1, fair: 2, good: 3, like_new: 4 };

export function ConditionMeter({ condition }: { condition: ToolCondition }) {
  const rank = RANK[condition];
  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn("h-2.5 w-1.5 rounded-sm", step <= rank ? "bg-ink" : "bg-line")}
          />
        ))}
      </span>
      <span className="font-semibold">{CONDITION_LABELS[condition]}</span>
    </span>
  );
}
