import { MessageSquare } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRange } from "@/lib/format";
import { LOAN_STATUS } from "@/lib/labels";
import { ActivityList } from "./activity-list";
import type { LoanView } from "./types";

type Perspective = "borrower" | "lender" | "admin";

function counterpart(loan: LoanView, perspective: Perspective): string {
  if (perspective === "borrower") return `from ${loan.owner.name}`;
  if (perspective === "lender") return `requested by ${loan.borrower.name}`;
  return `${loan.borrower.name} ← ${loan.owner.name}`;
}

export function LoanStatusBadge({ loan }: { loan: Pick<LoanView, "status" | "isOverdue"> }) {
  const status = LOAN_STATUS[loan.isOverdue ? "overdue" : loan.status];
  return <Badge tone={status.tone}>{status.label}</Badge>;
}

export function LoanCard({
  loan,
  perspective,
  actions,
}: {
  loan: LoanView;
  perspective: Perspective;
  actions?: ReactNode;
}) {
  return (
    <Card className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="font-semibold">{loan.toolName}</h3>
          <p className="text-sm text-muted">
            {formatRange(loan.startDate, loan.endDate)} · {counterpart(loan, perspective)}
          </p>
        </div>
        <LoanStatusBadge loan={loan} />
      </div>
      {loan.message && (
        <p className="flex gap-2 rounded-lg bg-background px-3 py-2 text-sm">
          <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          {loan.message}
        </p>
      )}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      <ActivityList activity={loan.activity} />
    </Card>
  );
}
