import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState, LoadingList } from "@/components/ui/states";
import type { LoanView } from "./types";

type Section = { title: string; filter: (loan: LoanView) => boolean };

export const LOAN_SECTIONS: Section[] = [
  { title: "Awaiting response", filter: (loan) => loan.status === "requested" },
  { title: "Active loans", filter: (loan) => loan.status === "approved" },
  {
    title: "History",
    filter: (loan) => loan.status !== "requested" && loan.status !== "approved",
  },
];

export function LoanSections({
  loans,
  empty,
  renderLoan,
}: {
  loans: LoanView[] | undefined;
  empty: { icon: LucideIcon; title: string; body: ReactNode };
  renderLoan: (loan: LoanView) => ReactNode;
}) {
  if (loans === undefined) return <LoadingList />;
  if (loans.length === 0) {
    return (
      <EmptyState icon={empty.icon} title={empty.title}>
        {empty.body}
      </EmptyState>
    );
  }

  return LOAN_SECTIONS.map(({ title, filter }) => {
    const matching = loans.filter(filter);
    if (matching.length === 0) return null;
    return (
      <section key={title} className="grid gap-3" aria-label={title}>
        <h2 className="text-sm font-semibold text-muted">
          {title} ({matching.length})
        </h2>
        <div className="grid gap-3">{matching.map(renderLoan)}</div>
      </section>
    );
  });
}
