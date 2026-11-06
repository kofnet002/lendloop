"use client";

import { useQuery } from "convex/react";
import { AlarmClock, ArrowUpRight, Hand, TriangleAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { addDays, todayISO } from "@/convex/lib/dates";
import { formatDate } from "@/lib/format";

type Item = { key: string; href: string; icon: LucideIcon; text: string; urgent?: boolean };

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Surfaces the few things that need the viewer's action, so the board doubles as a to-do list. */
export function NeedsYou() {
  const incoming = useQuery(api.loans.incoming);
  const borrowed = useQuery(api.loans.myRequests);
  if (!incoming || !borrowed) return null;

  const soon = addDays(todayISO(), 1);
  const waiting = incoming.filter((loan) => loan.status === "requested");
  const lentOverdue = incoming.filter((loan) => loan.isOverdue);
  const dueBack = borrowed.filter((loan) => loan.status === "approved" && loan.endDate <= soon);

  const items: Item[] = [
    ...(waiting.length > 0
      ? [
          {
            key: "waiting",
            href: "/incoming",
            icon: Hand,
            text: `${plural(waiting.length, "neighbor is", "neighbors are")} waiting for your answer`,
          },
        ]
      : []),
    ...dueBack.map((loan) => ({
      key: loan._id,
      href: "/requests",
      icon: loan.isOverdue ? TriangleAlert : AlarmClock,
      urgent: loan.isOverdue,
      text: loan.isOverdue
        ? `The ${loan.toolName.toLowerCase()} was due ${formatDate(loan.endDate)}. Please return it`
        : `Return the ${loan.toolName.toLowerCase()} to ${loan.owner.name} by ${formatDate(loan.endDate)}`,
    })),
    ...(lentOverdue.length > 0
      ? [
          {
            key: "lent-overdue",
            href: "/incoming",
            icon: TriangleAlert,
            urgent: true,
            text: `${plural(lentOverdue.length, "of your tools is", "of your tools are")} overdue. We've sent a reminder`,
          },
        ]
      : []),
  ];

  if (items.length === 0) return null;

  return (
    <section
      aria-label="Needs your attention"
      className="grid gap-2 rounded-2xl bg-[#1b2733] p-2 text-[#e6eae4]"
    >
      {items.map(({ key, href, icon: Icon, text, urgent }) => (
        <Link
          key={key}
          href={href}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5"
        >
          <span
            className={
              urgent
                ? "grid size-8 place-items-center rounded-lg bg-[#c8372d] text-white"
                : "grid size-8 place-items-center rounded-lg bg-yellow text-[#1b2733]"
            }
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="flex-1 text-sm font-medium">{text}</span>
          <ArrowUpRight
            className="size-4 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
            aria-hidden
          />
        </Link>
      ))}
    </section>
  );
}
