"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { SearchX } from "lucide-react";
import { useState } from "react";
import { RequestDialog } from "@/components/tools/request-dialog";
import { CategoryFilter } from "@/components/tools/category-filter";
import { ToolCard } from "@/components/tools/tool-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState, LoadingList, PageHeader } from "@/components/ui/states";
import { api } from "@/convex/_generated/api";
import type { ToolCategory } from "@/convex/lib/constants";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useViewer } from "@/hooks/use-viewer";

type BoardTool = FunctionReturnType<typeof api.tools.list>[number];

export default function BoardPage() {
  const [category, setCategory] = useState<ToolCategory>();
  const [requesting, setRequesting] = useState<BoardTool | null>(null);
  const tools = useQuery(api.tools.list, { category });
  const removeTool = useMutation(api.admin.removeTool);
  const { isAdmin } = useViewer();
  const { run } = useAsyncAction();

  return (
    <>
      <PageHeader
        title="Neighborhood board"
        description="Everything your neighbors are willing to lend."
      />
      <CategoryFilter value={category} onChange={setCategory} />

      {tools === undefined ? (
        <LoadingList />
      ) : tools.length === 0 ? (
        <EmptyState icon={SearchX} title="No tools here yet">
          Try another category, or list one of your own.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <ToolCard
              key={tool._id}
              tool={tool}
              owner={tool.owner}
              meta={tool.isOwn && <Badge>Your listing</Badge>}
              actions={
                <>
                  {isAdmin && (
                    <ConfirmButton
                      size="sm"
                      variant="secondary"
                      title={`Remove “${tool.name}”?`}
                      description="The listing is hidden from everyone and its open requests are declined."
                      confirmLabel="Remove listing"
                      onConfirm={() =>
                        run(tool._id, () => removeTool({ toolId: tool._id }), "Listing removed")
                      }
                    >
                      Remove
                    </ConfirmButton>
                  )}
                  {!tool.isOwn && (
                    <Button size="sm" onClick={() => setRequesting(tool)}>
                      Request
                    </Button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      <RequestDialog tool={requesting} onClose={() => setRequesting(null)} />
    </>
  );
}
