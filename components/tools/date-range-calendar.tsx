"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { addDays, daysBetween, rangesOverlap, type DateRange } from "@/convex/lib/dates";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const monthFormat = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dayLabel = new Intl.DateTimeFormat("en", { dateStyle: "full", timeZone: "UTC" });

type Selection = { startDate: string; endDate?: string };

type DateRangeCalendarProps = {
  value: Selection;
  onChange: (value: Selection) => void;
  minDate: string;
  maxDate: string;
  maxDays: number;
  booked: DateRange[];
};

function monthStart(date: string) {
  return `${date.slice(0, 7)}-01`;
}

function shiftMonth(month: string, delta: number) {
  const d = new Date(`${month}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 10);
}

function monthDays(month: string): (string | null)[] {
  const first = new Date(`${month}T00:00:00Z`);
  const leading = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, index) => addDays(month, index)),
  ];
}

/** Range picker that shows booked days, so borrowers pick free dates on the first try. */
export function DateRangeCalendar({
  value,
  onChange,
  minDate,
  maxDate,
  maxDays,
  booked,
}: DateRangeCalendarProps) {
  const [month, setMonth] = useState(monthStart(value.startDate));
  const days = useMemo(() => monthDays(month), [month]);

  const isBooked = (day: string) =>
    booked.some((range) => rangesOverlap(range, { startDate: day, endDate: day }));
  const isDisabled = (day: string) => day < minDate || day > maxDate || isBooked(day);

  function select(day: string) {
    const { startDate, endDate } = value;
    const extending = !endDate && day >= startDate;
    const candidate = { startDate, endDate: day };
    if (
      extending &&
      daysBetween(startDate, day) < maxDays &&
      !booked.some((range) => rangesOverlap(range, candidate))
    ) {
      onChange(candidate);
    } else {
      onChange({ startDate: day });
    }
  }

  const end = value.endDate ?? value.startDate;
  const canGoBack = monthStart(minDate) < month;
  const canGoForward = shiftMonth(month, 1) <= maxDate;

  return (
    <div className="grid gap-3 rounded-xl border-2 border-ink bg-surface p-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, -1))}
          disabled={!canGoBack}
          className="grid size-8 place-items-center rounded-lg hover:bg-paper disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="font-display text-xl font-extrabold tracking-wide" aria-live="polite">
          {monthFormat.format(new Date(`${month}T00:00:00Z`))}
        </p>
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={!canGoForward}
          className="grid size-8 place-items-center rounded-lg hover:bg-paper disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-sm" role="grid">
        {WEEKDAYS.map((day) => (
          <span key={day} className="pb-1 text-xs font-semibold text-muted" role="columnheader">
            {day}
          </span>
        ))}
        {days.map((day, index) => {
          if (!day) return <span key={`blank-${index}`} />;
          const selected = day >= value.startDate && day <= end;
          const edge = day === value.startDate || day === end;
          const booked = isBooked(day);
          return (
            <button
              key={day}
              type="button"
              disabled={isDisabled(day)}
              onClick={() => select(day)}
              aria-pressed={selected}
              data-autofocus={day === value.startDate || undefined}
              aria-label={`${dayLabel.format(new Date(`${day}T00:00:00Z`))}${booked ? ", already booked" : ""}`}
              className={cn(
                "relative mx-auto grid size-9 place-items-center rounded-lg font-medium tabular-nums transition-colors",
                "hover:bg-yellow-soft focus-visible:outline-2 focus-visible:outline-stamp-blue",
                "disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:bg-transparent",
                booked &&
                  "bg-[repeating-linear-gradient(135deg,var(--line)_0_3px,transparent_3px_7px)] line-through",
                selected && "bg-yellow-soft",
                edge && "press bg-yellow text-[#1b2733] hover:bg-yellow",
              )}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-yellow ring-1 ring-ink" /> Your dates
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-[repeating-linear-gradient(135deg,var(--muted)_0_2px,transparent_2px_4px)]" />
          Already booked
        </span>
      </div>
    </div>
  );
}
