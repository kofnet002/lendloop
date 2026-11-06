"use client";

import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LIMITS } from "@/convex/lib/constants";
import { addDays, todayISO, type DateRange } from "@/convex/lib/dates";
import { useAsyncAction } from "@/hooks/use-async-action";
import { formatRange } from "@/lib/format";

type RequestDialogProps = {
  tool: { _id: Id<"tools">; name: string; availability: { bookedRanges: DateRange[] } } | null;
  onClose: () => void;
};

export function RequestDialog({ tool, onClose }: RequestDialogProps) {
  return (
    <Dialog
      open={tool !== null}
      onClose={onClose}
      title={tool ? `Borrow ${tool.name}` : ""}
      description="The lender is notified and can approve or decline your request."
    >
      {tool && <RequestForm key={tool._id} tool={tool} onDone={onClose} />}
    </Dialog>
  );
}

function RequestForm({
  tool,
  onDone,
}: {
  tool: NonNullable<RequestDialogProps["tool"]>;
  onDone: () => void;
}) {
  const today = todayISO();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 1));
  const [message, setMessage] = useState("");
  const request = useMutation(api.loans.request);
  const { run, busy } = useAsyncAction();
  const booked = tool.availability.bookedRanges;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const sent = await run(
      "request",
      () => request({ toolId: tool._id, startDate, endDate, message }),
      "Request sent. The lender has been notified.",
    );
    if (sent) onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From">
          <Input
            type="date"
            required
            min={today}
            max={addDays(today, LIMITS.maxAdvanceDays)}
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              if (endDate < event.target.value) setEndDate(event.target.value);
            }}
          />
        </Field>
        <Field label="Until">
          <Input
            type="date"
            required
            min={startDate}
            max={addDays(startDate, LIMITS.maxLoanDays - 1)}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </Field>
      </div>
      {booked.length > 0 && (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
          Already booked:{" "}
          {booked.map((range) => formatRange(range.startDate, range.endDate)).join(", ")}
        </p>
      )}
      <Field label="Message (optional)" hint={`Up to ${LIMITS.loanMessage.max} characters`}>
        <Textarea
          maxLength={LIMITS.loanMessage.max}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What's it for? When could you pick it up?"
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
