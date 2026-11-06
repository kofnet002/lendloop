"use client";

import { useMutation, useQuery } from "convex/react";
import { Inbox } from "lucide-react";
import Link from "next/link";
import { LoanCard } from "@/components/loans/loan-card";
import { LoanSections } from "@/components/loans/loan-sections";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/states";
import { api } from "@/convex/_generated/api";
import { useAsyncAction } from "@/hooks/use-async-action";

export default function RequestsPage() {
  const loans = useQuery(api.loans.myRequests);
  const cancel = useMutation(api.loans.cancel);
  const { run, isPending } = useAsyncAction();

  return (
    <>
      <PageHeader title="My requests" description="Tools you've asked to borrow." />
      <LoanSections
        loans={loans}
        empty={{
          icon: Inbox,
          title: "No requests yet",
          body: (
            <>
              Find something on the{" "}
              <Link href="/board" className="text-accent underline">
                board
              </Link>
              .
            </>
          ),
        }}
        renderLoan={(loan) => (
          <LoanCard
            key={loan._id}
            loan={loan}
            perspective="borrower"
            actions={
              loan.status === "requested" && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPending(loan._id)}
                  onClick={() =>
                    run(loan._id, () => cancel({ loanId: loan._id }), "Request cancelled")
                  }
                >
                  Cancel request
                </Button>
              )
            }
          />
        )}
      />
    </>
  );
}
