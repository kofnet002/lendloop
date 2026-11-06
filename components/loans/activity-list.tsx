import { BellRing, CircleAlert, Clock } from "lucide-react";
import { EVENT_LABELS } from "@/lib/labels";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LoanActivity } from "./types";

const STATUS_TEXT = { sent: "sent", pending: "queued", failed: "failed" } as const;

function describe(event: LoanActivity): string {
  const label =
    event.kind === "overdue_reminder" ? "Overdue reminder" : EVENT_LABELS[event.eventType!];
  const channel = event.status === "sent" && event.channel ? ` via ${event.channel}` : "";
  return `${label} ${STATUS_TEXT[event.status]}${channel}`;
}

const ICONS = { sent: BellRing, pending: Clock, failed: CircleAlert } as const;

export function ActivityList({ activity }: { activity: LoanActivity[] }) {
  if (activity.length === 0) return null;
  return (
    <ul
      className="grid gap-1.5 border-t border-dashed border-line pt-3 text-xs text-muted"
      aria-label="Automation activity"
    >
      {activity.map((event) => {
        const Icon = ICONS[event.status];
        return (
          <li
            key={event._id}
            className={cn(
              "flex items-center gap-1.5",
              event.status === "failed" && "text-stamp-red",
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span>{describe(event)}</span>
            <time className="ml-auto shrink-0" dateTime={new Date(event.at).toISOString()}>
              {timeAgo(event.at)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
