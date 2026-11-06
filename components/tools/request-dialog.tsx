"use client";

import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LIMITS } from "@/convex/lib/constants";
import { addDays, daysBetween, rangesOverlap, todayISO, type DateRange } from "@/convex/lib/dates";
import { useAsyncAction } from "@/hooks/use-async-action";
import { formatRange } from "@/lib/format";
import { DateRangeCalendar } from "./date-range-calendar";

type RequestDialogProps = {
  tool: { _id: Id<"tools">; name: string; availability: { bookedRanges: DateRange[] } } | null;
  onClose: () => void;
};

export function RequestDialog({ tool, onClose }: RequestDialogProps) {
  return (
    <Dialog
      open={tool !== null}
      onClose={onClose}
      title={tool ? `Borrow the ${tool.name.toLowerCase()}` : ""}
      description="Pick a start day, then a return day. The lender is notified right away."
    >
      {tool && <RequestForm key={tool._id} tool={tool} onDone={onClose} />}
    </Dialog>
  );
}

function firstFreeDay(from: string, booked: DateRange[]): string {
  let day = from;
  while (booked.some((range) => rangesOverlap(range, { startDate: day, endDate: day }))) {
    day = addDays(day, 1);
  }
  return day;
}

function RequestForm({
  tool,
  onDone,
}: {
  tool: NonNullable<RequestDialogProps["tool"]>;
  onDone: () => void;
}) {
  const today = todayISO();
  const booked = tool.availability.bookedRanges;
  const [selection, setSelection] = useState<{ startDate: string; endDate?: string }>(() => {
    const day = firstFreeDay(today, booked);
    return { startDate: day, endDate: day };
  });
  const [message, setMessage] = useState("");
  const request = useMutation(api.loans.request);
  const { run, busy } = useAsyncAction();

  const endDate = selection.endDate ?? selection.startDate;
  const days = daysBetween(selection.startDate, endDate) + 1;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const sent = await run(
      "request",
      () => request({ toolId: tool._id, startDate: selection.startDate, endDate, message }),
      "Request sent. The lender has been notified.",
    );
    if (sent) onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DateRangeCalendar
        value={selection}
        onChange={setSelection}
        minDate={today}
        maxDate={addDays(today, LIMITS.maxAdvanceDays)}
        maxDays={LIMITS.maxLoanDays}
        booked={booked}
      />
      <p className="flex items-baseline justify-between gap-3 rounded-lg bg-yellow-soft px-3 py-2 text-sm">
        <span className="font-semibold">{formatRange(selection.startDate, endDate)}</span>
        <span className="text-muted">
          {days} day{days === 1 ? "" : "s"}
          {!selection.endDate && ", now tap your return day"}
        </span>
      </p>
      <Field
        label="Note for the lender (optional)"
        hint={`Up to ${LIMITS.loanMessage.max} characters`}
      >
        <Textarea
          maxLength={LIMITS.loanMessage.max}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What's it for? When could you pick it up?"
          className="min-h-20"
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          Send request
        </Button>
      </div>
    </form>
  );
}
