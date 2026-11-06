import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoanView } from "./types";

type StepState = "done" | "current" | "upcoming" | "alert" | "stopped";
type Step = { label: string; state: StepState };

function stepsFor(loan: LoanView, today: string): Step[] {
  const started = loan.startDate <= today;
  switch (loan.status) {
    case "requested":
      return [
        { label: "Requested", state: "current" },
        { label: "Approved", state: "upcoming" },
        { label: "On loan", state: "upcoming" },
        { label: "Returned", state: "upcoming" },
      ];
    case "approved":
      return [
        { label: "Requested", state: "done" },
        { label: "Approved", state: started ? "done" : "current" },
        {
          label: loan.isOverdue ? "Overdue" : "On loan",
          state: loan.isOverdue ? "alert" : started ? "current" : "upcoming",
        },
        { label: "Returned", state: "upcoming" },
      ];
    case "returned":
      return ["Requested", "Approved", "On loan", "Returned"].map((label) => ({
        label,
        state: "done",
      }));
    case "declined":
    case "cancelled":
      return [
        { label: "Requested", state: "done" },
        { label: loan.status === "declined" ? "Declined" : "Cancelled", state: "stopped" },
      ];
  }
}

const DOT: Record<StepState, string> = {
  done: "bg-ink text-surface",
  current: "bg-yellow text-navy ring-2 ring-ink",
  upcoming: "bg-surface ring-2 ring-line",
  alert: "bg-stamp-red text-white",
  stopped: "bg-stamp-grey text-white",
};

export function LoanJourney({ loan, today }: { loan: LoanView; today: string }) {
  const steps = stepsFor(loan, today);
  return (
    <ol className="flex items-center text-[11px] sm:text-xs" aria-label="Loan progress">
      {steps.map((step, index) => (
        <li key={step.label} className="flex flex-1 items-center gap-1 last:flex-none sm:gap-2">
          <span className="flex items-center gap-1 whitespace-nowrap sm:gap-1.5">
            <span
              className={cn("grid size-5 place-items-center rounded-full", DOT[step.state])}
              aria-hidden
            >
              {step.state === "done" && <Check className="size-3" strokeWidth={3} />}
              {step.state === "stopped" && <X className="size-3" strokeWidth={3} />}
            </span>
            <span
              className={cn(
                "font-medium",
                step.state !== "current" && step.state !== "alert" && "sr-only sm:not-sr-only",
                step.state === "upcoming" && "text-muted",
                step.state === "alert" && "text-stamp-red",
              )}
              aria-current={step.state === "current" ? "step" : undefined}
            >
              {step.label}
            </span>
          </span>
          {index < steps.length - 1 && (
            <span
              className={cn(
                "h-0.5 min-w-2 flex-1 rounded sm:mx-1",
                step.state === "done" ? "bg-ink" : "bg-line",
              )}
              aria-hidden
            />
          )}
        </li>
      ))}
    </ol>
  );
}
