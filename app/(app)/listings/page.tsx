"use client";

import { useMutation, useQuery } from "convex/react";
import { PackageOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useState, type ComponentProps } from "react";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolFormDialog } from "@/components/tools/tool-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState, LoadingList, PageHeader } from "@/components/ui/states";
import { api } from "@/convex/_generated/api";
import { useAsyncAction } from "@/hooks/use-async-action";

type EditingTool = ComponentProps<typeof ToolFormDialog>["tool"];

export default function ListingsPage() {
  const tools = useQuery(api.tools.mine);
  const removeTool = useMutation(api.tools.remove);
  const { run } = useAsyncAction();
  const [form, setForm] = useState<{ open: boolean; tool?: EditingTool }>({ open: false });

  return (
    <>
      <PageHeader
        title="My listings"
        description="Tools you're lending to the neighborhood."
        action={
          <Button onClick={() => setForm({ open: true })}>
            <Plus className="size-4" aria-hidden />
            List a tool
          </Button>
        }
      />

      {tools === undefined ? (
        <LoadingList />
      ) : tools.length === 0 ? (
        <EmptyState icon={PackageOpen} title="You haven't listed anything yet">
          Share a tool you rarely use. You approve every request.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool, index) => (
            <ToolCard
              key={tool._id}
              index={index}
              tool={tool}
              meta={
                tool.pendingRequests > 0 && (
                  <Link href="/incoming">
                    <Badge tone="warning">
                      {tool.pendingRequests} pending request{tool.pendingRequests > 1 ? "s" : ""}
                    </Badge>
                  </Link>
                )
              }
              actions={
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setForm({ open: true, tool })}
                  >
                    Edit
                  </Button>
                  <ConfirmButton
                    size="sm"
                    variant="secondary"
                    title={`Delete “${tool.name}”?`}
                    description="Neighbors will no longer see it. Open requests are declined automatically."
                    confirmLabel="Delete listing"
                    onConfirm={() =>
                      run(tool._id, () => removeTool({ toolId: tool._id }), "Listing deleted")
                    }
                  >
                    Delete
                  </ConfirmButton>
                </>
              }
            />
          ))}
        </div>
      )}

      <ToolFormDialog open={form.open} tool={form.tool} onClose={() => setForm({ open: false })} />
    </>
  );
}
