"use client";

import { useMutation, useQuery } from "convex/react";
import { Activity, CheckCircle2, Inbox, ShieldAlert, Users } from "lucide-react";
import { useState } from "react";
import { LoanCard } from "@/components/loans/loan-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { EmptyState, LoadingList, PageHeader } from "@/components/ui/states";
import { api } from "@/convex/_generated/api";
import { LOAN_STATUSES, type LoanStatus } from "@/convex/lib/constants";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useViewer } from "@/hooks/use-viewer";
import { timeAgo } from "@/lib/format";
import { LOAN_STATUS } from "@/lib/labels";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "loans", label: "All loans" },
  { id: "users", label: "Neighbors" },
  { id: "automation", label: "Automation" },
] as const;

type Tab = (typeof TABS)[number]["id"];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...LOAN_STATUSES.map((value) => ({ value, label: LOAN_STATUS[value].label })),
];

export default function AdminPage() {
  const { isAdmin, isLoading } = useViewer();
  const [tab, setTab] = useState<Tab>("loans");

  if (isLoading) return <LoadingList />;
  if (!isAdmin) {
    return (
      <EmptyState icon={ShieldAlert} title="Admins only">
        Ask an administrator if you need access.
      </EmptyState>
    );
  }

  return (
    <>
      <PageHeader
        title="Admin"
        description="Moderate listings, review loans and keep automations healthy."
      />
      <div className="flex gap-1 border-b border-border" role="tablist">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-muted",
              tab === id && "border-accent font-medium text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "loans" && <AllLoans />}
      {tab === "users" && <Neighbors />}
      {tab === "automation" && <AutomationHealth />}
    </>
  );
}

function AllLoans() {
  const [status, setStatus] = useState<LoanStatus | "">("");
  const loans = useQuery(api.admin.loans, { status: status || undefined });

  return (
    <div className="grid gap-4">
      <div className="w-48">
        <Select
          aria-label="Filter by status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(event) => setStatus(event.target.value as LoanStatus | "")}
        />
      </div>
      {loans === undefined ? (
        <LoadingList />
      ) : loans.length === 0 ? (
        <EmptyState icon={Inbox} title="No loans match this filter" />
      ) : (
        loans.map((loan) => <LoanCard key={loan._id} loan={loan} perspective="admin" />)
      )}
    </div>
  );
}

function Neighbors() {
  const users = useQuery(api.admin.users);
  const setTrusted = useMutation(api.admin.setTrustedLender);
  const { run, isPending } = useAsyncAction();

  if (users === undefined) return <LoadingList />;
  if (users.length === 0) return <EmptyState icon={Users} title="No neighbors yet" />;

  return (
    <Card className="divide-y divide-border p-0">
      {users.map((user) => (
        <div key={user._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="grid min-w-0">
            <span className="flex items-center gap-2 font-medium">
              {user.name}
              {user.role === "admin" && <Badge>Admin</Badge>}
              {user.isTrustedLender && <Badge tone="success">Trusted lender</Badge>}
            </span>
            <span className="truncate text-sm text-muted">{user.email ?? "No email"}</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={isPending(user._id)}
            onClick={() =>
              run(
                user._id,
                () => setTrusted({ userId: user._id, trusted: !user.isTrustedLender }),
                user.isTrustedLender ? "Trusted badge removed" : "Marked as trusted lender",
              )
            }
          >
            {user.isTrustedLender ? "Remove trusted" : "Mark trusted"}
          </Button>
        </div>
      ))}
    </Card>
  );
}

function AutomationHealth() {
  const health = useQuery(api.admin.automationHealth);
  const retry = useMutation(api.admin.retryAutomationEvent);
  const { run, isPending } = useAsyncAction();

  if (health === undefined) return <LoadingList />;
  const healthy = health.failedEvents.length === 0 && health.workflowFailures.length === 0;

  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted">
        {health.pendingCount} notification{health.pendingCount === 1 ? "" : "s"} queued for
        delivery.
      </p>
      {healthy && (
        <EmptyState icon={CheckCircle2} title="All automations healthy">
          Failed deliveries and n8n workflow errors appear here.
        </EmptyState>
      )}
      {health.failedEvents.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-muted">Failed deliveries</h2>
          {health.failedEvents.map((event) => (
            <Card key={event._id} className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1 text-sm">
                <code className="text-xs">{event.idempotencyKey}</code>
                <span className="text-danger">{event.lastError ?? "Unknown error"}</span>
                <span className="text-xs text-muted">
                  {event.attempts} attempt{event.attempts === 1 ? "" : "s"}
                  {event.completedAt && ` · ${timeAgo(event.completedAt)}`}
                </span>
              </div>
              {event.kind === "loan_notification" && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPending(event._id)}
                  onClick={() =>
                    run(event._id, () => retry({ eventId: event._id }), "Retry scheduled")
                  }
                >
                  Retry
                </Button>
              )}
            </Card>
          ))}
        </section>
      )}
      {health.workflowFailures.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-muted">n8n workflow errors</h2>
          {health.workflowFailures.map((failure) => (
            <Card key={failure._id} className="grid gap-1 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Activity className="size-4 text-danger" aria-hidden />
                {failure.workflow}
              </span>
              <span className="text-danger">{failure.message}</span>
              <span className="text-xs text-muted">
                {failure.node && `Node “${failure.node}” · `}execution {failure.executionId} ·{" "}
                {timeAgo(failure._creationTime)}
              </span>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
