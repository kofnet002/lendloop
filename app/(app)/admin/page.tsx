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
import { EVENT_LABELS, LOAN_STATUS } from "@/lib/labels";
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
      <div className="flex gap-1 border-b border-line" role="tablist">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px border-b-[3px] border-transparent px-3 py-2 text-sm font-medium text-muted",
              tab === id && "border-yellow text-ink",
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
    <Card className="divide-y divide-line p-0">
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
  const dismissEvent = useMutation(api.admin.dismissAutomationEvent);
  const dismissFailure = useMutation(api.admin.dismissWorkflowFailure);
  const { run, busy } = useAsyncAction();

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
          Failed deliveries and n8n workflow errors appear here until you retry or dismiss them.
        </EmptyState>
      )}
      {health.failedEvents.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-muted">Failed deliveries</h2>
          {health.failedEvents.map((event) => (
            <Card key={event._id} className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1 text-sm">
                <span className="font-medium">
                  {event.kind === "overdue_reminder"
                    ? "Overdue reminder"
                    : EVENT_LABELS[event.eventType!]}{" "}
                  for the {event.toolName.toLowerCase()}
                </span>
                <span className="text-stamp-red">{event.lastError ?? "Unknown error"}</span>
                <span className="flex flex-wrap gap-x-4 text-xs text-muted">
                  <span>
                    {event.attempts} attempt{event.attempts === 1 ? "" : "s"}
                  </span>
                  {event.completedAt && <span>{timeAgo(event.completedAt)}</span>}
                  <code>{event.idempotencyKey}</code>
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    run(event._id, () => dismissEvent({ eventId: event._id }), "Dismissed")
                  }
                >
                  Dismiss
                </Button>
                {event.kind === "loan_notification" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      run(event._id, () => retry({ eventId: event._id }), "Retry scheduled")
                    }
                  >
                    Retry
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </section>
      )}
      {health.workflowFailures.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-muted">n8n workflow errors</h2>
          {health.workflowFailures.map((failure) => (
            <Card key={failure._id} className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Activity className="size-4 text-stamp-red" aria-hidden />
                  {failure.workflow}
                </span>
                <span className="text-stamp-red">{failure.message}</span>
                <span className="flex flex-wrap gap-x-4 text-xs text-muted">
                  {failure.node && <span>Node “{failure.node}”</span>}
                  <span>Execution {failure.executionId}</span>
                  <span>{timeAgo(failure._creationTime)}</span>
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() =>
                  run(failure._id, () => dismissFailure({ failureId: failure._id }), "Dismissed")
                }
              >
                Dismiss
              </Button>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
