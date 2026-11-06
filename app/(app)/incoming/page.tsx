"use client";

import { useMutation, useQuery } from "convex/react";
import { Inbox } from "lucide-react";
import { LoanCard } from "@/components/loans/loan-card";
import { LoanSections } from "@/components/loans/loan-sections";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/states";
import { api } from "@/convex/_generated/api";
import { todayISO } from "@/convex/lib/dates";
import { useAsyncAction } from "@/hooks/use-async-action";

export default function IncomingPage() {
  const loans = useQuery(api.loans.incoming);
  const approve = useMutation(api.loans.approve);
  const decline = useMutation(api.loans.decline);
  const markReturned = useMutation(api.loans.markReturned);
  const { run, busy } = useAsyncAction();
  const today = todayISO();

  return (
    <>
      <PageHeader title="Incoming requests" description="Requests to borrow your tools." />
      <LoanSections
        loans={loans}
        empty={{
          icon: Inbox,
          title: "No incoming requests",
          body: "When a neighbor asks to borrow one of your tools, it shows up here.",
        }}
        renderLoan={(loan) => {
          const loanId = loan._id;
          return (
            <LoanCard
              key={loanId}
              loan={loan}
              perspective="lender"
              actions={
                loan.status === "requested" ? (
                  <>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        run(
                          loanId,
                          () => approve({ loanId }),
                          "Approved. The borrower has been notified.",
                        )
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => run(loanId, () => decline({ loanId }), "Request declined")}
                    >
                      Decline
                    </Button>
                  </>
                ) : (
                  loan.status === "approved" &&
                  loan.startDate <= today && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        run(loanId, () => markReturned({ loanId }), "Marked as returned")
                      }
                    >
                      Mark returned
                    </Button>
                  )
                )
              }
            />
          );
        }}
      />
    </>
  );
}
