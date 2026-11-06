"use client";

import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { LIMITS } from "@/convex/lib/constants";
import type { ToolInput } from "@/convex/lib/tools";
import { useAsyncAction } from "@/hooks/use-async-action";
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from "@/lib/labels";

const EMPTY: ToolInput = { name: "", category: "power_tools", condition: "good", description: "" };

type ToolFormDialogProps = {
  open: boolean;
  onClose: () => void;
  tool?: Pick<Doc<"tools">, "_id" | keyof ToolInput>;
};

export function ToolFormDialog({ open, onClose, tool }: ToolFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={tool ? "Edit listing" : "List a tool"}
      description="Neighbors see the name, category, condition and description."
    >
      <ToolForm key={tool?._id ?? "new"} tool={tool} onDone={onClose} />
    </Dialog>
  );
}

function ToolForm({ tool, onDone }: { tool?: ToolFormDialogProps["tool"]; onDone: () => void }) {
  const [values, setValues] = useState<ToolInput>(() =>
    tool
      ? {
          name: tool.name,
          category: tool.category,
          condition: tool.condition,
          description: tool.description,
        }
      : EMPTY,
  );
  const create = useMutation(api.tools.create);
  const update = useMutation(api.tools.update);
  const { run, busy } = useAsyncAction();

  const set = <K extends keyof ToolInput>(key: K, value: ToolInput[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await run(
      "save",
      () => (tool ? update({ toolId: tool._id, ...values }) : create(values)),
      tool ? "Listing updated" : "Tool listed",
    );
    if (saved) onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Name">
        <Input
          required
          minLength={LIMITS.toolName.min}
          maxLength={LIMITS.toolName.max}
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
          placeholder="Cordless drill"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Select
            options={CATEGORY_OPTIONS}
            value={values.category}
            onChange={(event) => set("category", event.target.value as ToolInput["category"])}
          />
        </Field>
        <Field label="Condition">
          <Select
            options={CONDITION_OPTIONS}
            value={values.condition}
            onChange={(event) => set("condition", event.target.value as ToolInput["condition"])}
          />
        </Field>
      </div>
      <Field
        label="Description"
        hint={`${values.description.length}/${LIMITS.toolDescription.max}`}
      >
        <Textarea
          maxLength={LIMITS.toolDescription.max}
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          placeholder="Anything a borrower should know: accessories, quirks, pickup notes."
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {tool ? "Save changes" : "List tool"}
        </Button>
      </div>
    </form>
  );
}
