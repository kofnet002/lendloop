"use client";

import { MessageSquare } from "lucide-react";
import type { ReactNode } from "react";
import { Stamp } from "@/components/ui/badge";
import { toISODate, todayISO } from "@/convex/lib/dates";
import { useChanged } from "@/hooks/use-changed";
import { formatDate, formatRange } from "@/lib/format";
import { LOAN_STATUS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { ActivityList } from "./activity-list";
import { LoanJourney } from "./loan-journey";
import type { LoanView } from "./types";

type Perspective = "borrower" | "lender" | "admin";

const monthFormat = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });

/** What the stub stamps: the due date while a loan is live, otherwise how it ended. */
function stubFor(loan: LoanView): { label: string; date: string; muted: boolean } {
  switch (loan.status) {
    case "returned":
      return {
        label: "Back",
        date: toISODate(loan.returnedAt ?? loan._creationTime),
        muted: false,
      };
    case "declined":
    case "cancelled":
      return { label: "Wanted", date: loan.startDate, muted: true };
    default:
      return { label: "Due", date: loan.endDate, muted: false };
  }
}

function DateStub({ loan }: { loan: LoanView }) {
  const { label, date, muted } = stubFor(loan);
  const day = new Date(`${date}T00:00:00Z`);
  return (
    <div
      className={cn(
        "grid w-20 shrink-0 content-center justify-items-center border-r-2 border-dashed border-line bg-paper/60 px-2 py-4 text-center sm:w-24",
        loan.isOverdue && "bg-stamp-red/10 text-stamp-red",
        muted && "text-muted",
      )}
      aria-label={`${label} ${formatDate(date)}`}
    >
      <span className="text-xs text-muted">{label}</span>
      <span className="font-numeric text-4xl leading-none font-extrabold">{day.getUTCDate()}</span>
      <span className="text-sm font-semibold">{monthFormat.format(day)}</span>
    </div>
  );
}

function Party({ label, name }: { label: string; name: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="grid size-6 place-items-center rounded-full bg-ink text-[11px] font-bold text-surface">
        {name.charAt(0)}
      </span>
      <span className="text-muted">{label}</span>
      <span className="font-medium">{name}</span>
    </span>
  );
}

function Parties({ loan, perspective }: { loan: LoanView; perspective: Perspective }) {
  if (perspective === "borrower") return <Party label="Lent by" name={loan.owner.name} />;
  if (perspective === "lender") return <Party label="Requested by" name={loan.borrower.name} />;
  return (
    <>
      <Party label="Borrower" name={loan.borrower.name} />
      <Party label="Lender" name={loan.owner.name} />
    </>
  );
}

/** A library-style due card: the stub carries the return date, the body carries the story. */
export function LoanCard({
  loan,
  perspective,
  actions,
}: {
  loan: LoanView;
  perspective: Perspective;
  actions?: ReactNode;
}) {
  const statusKey = loan.isOverdue ? "overdue" : loan.status;
  const status = LOAN_STATUS[statusKey];
  const statusChanged = useChanged(statusKey);

  return (
    <article className="flex overflow-hidden rounded-xl border border-line bg-surface">
      <DateStub loan={loan} />

      <div className="grid min-w-0 flex-1 gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-0.5">
            <h3 className="font-display text-2xl leading-tight font-extrabold tracking-wide">
              {loan.toolName}
            </h3>
            <p className="text-sm text-muted">{formatRange(loan.startDate, loan.endDate)}</p>
          </div>
          <Stamp key={statusKey} tone={status.tone} className={cn(statusChanged && "stamp-thunk")}>
            {status.label}
          </Stamp>
        </div>
        <LoanJourney loan={loan} today={todayISO()} />
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Parties loan={loan} perspective={perspective} />
        </div>
        {loan.message && (
          <p className="flex gap-2 rounded-lg bg-paper px-3 py-2 text-sm">
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            {loan.message}
          </p>
        )}
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        <ActivityList activity={loan.activity} />
      </div>
    </article>
  );
}
