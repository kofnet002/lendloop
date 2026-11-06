import { BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { ToolCategory, ToolCondition } from "@/convex/lib/constants";
import type { Availability } from "@/convex/lib/tools";
import { CATEGORY_LABELS } from "@/lib/labels";
import { AvailabilityStamp } from "./availability-stamp";
import { ToolArt } from "./category";
import { ConditionMeter } from "./condition-meter";
import { HangTag } from "./hang-tag";

type ToolCardProps = {
  tool: {
    name: string;
    category: ToolCategory;
    condition: ToolCondition;
    description: string;
    availability: Availability;
  };
  owner?: { name: string; isTrustedLender: boolean };
  meta?: ReactNode;
  actions?: ReactNode;
};

export function ToolCard({ tool, owner, meta, actions }: ToolCardProps) {
  return (
    <HangTag className="flex flex-col">
      <div className="relative">
        <ToolArt category={tool.category} className="h-36" />
        <div className="absolute right-3 -bottom-3 rounded-md bg-surface/95 px-1 py-0.5">
          <AvailabilityStamp availability={tool.availability} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pt-5 pb-5">
        <div className="grid gap-1.5">
          <p className="text-xs font-semibold text-muted">{CATEGORY_LABELS[tool.category]}</p>
          <h3 className="font-display text-[1.7rem] leading-none font-extrabold tracking-wide">
            {tool.name}
          </h3>
          <ConditionMeter condition={tool.condition} />
        </div>

        {tool.description && <p className="line-clamp-2 text-sm text-muted">{tool.description}</p>}

        <div className="mt-auto grid gap-3 border-t border-dashed border-line pt-3">
          {(owner || meta) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {owner && (
                <>
                  <span className="grid size-6 place-items-center rounded-full bg-ink text-[11px] font-bold text-surface">
                    {owner.name.charAt(0)}
                  </span>
                  <span className="font-medium">{owner.name}</span>
                  {owner.isTrustedLender && (
                    <span
                      className="flex items-center gap-1 text-xs font-semibold text-stamp-green"
                      title="Marked trusted by an admin"
                    >
                      <BadgeCheck className="size-4" aria-hidden />
                      Trusted
                    </span>
                  )}
                </>
              )}
              {meta}
            </div>
          )}
          {actions && <div className="flex flex-wrap gap-2 *:flex-1">{actions}</div>}
        </div>
      </div>
    </HangTag>
  );
}
