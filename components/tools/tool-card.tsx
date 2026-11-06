import { BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ToolCategory, ToolCondition } from "@/convex/lib/constants";
import type { Availability } from "@/convex/lib/tools";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/labels";
import { AvailabilityBadge } from "./availability-badge";

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
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h3 className="truncate font-semibold">{tool.name}</h3>
          <p className="text-xs text-muted">
            {CATEGORY_LABELS[tool.category]} · {CONDITION_LABELS[tool.condition]}
          </p>
        </div>
        <AvailabilityBadge availability={tool.availability} />
      </div>
      {tool.description && <p className="line-clamp-3 text-sm text-muted">{tool.description}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {owner && (
            <span className="flex items-center gap-1.5">
              {owner.name}
              {owner.isTrustedLender && (
                <Badge tone="success" title="Marked trusted by an admin">
                  <BadgeCheck className="size-3" aria-hidden />
                  Trusted lender
                </Badge>
              )}
            </span>
          )}
          {meta}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </Card>
  );
}
