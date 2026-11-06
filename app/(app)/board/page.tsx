"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Search, SearchX } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { NeedsYou } from "@/components/loans/needs-you";
import { CategoryFilter } from "@/components/tools/category-filter";
import { RequestDialog } from "@/components/tools/request-dialog";
import { ToolCard } from "@/components/tools/tool-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Input } from "@/components/ui/field";
import { EmptyState, LoadingList, PageHeader } from "@/components/ui/states";
import { api } from "@/convex/_generated/api";
import type { ToolCategory } from "@/convex/lib/constants";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useViewer } from "@/hooks/use-viewer";

type BoardTool = FunctionReturnType<typeof api.tools.list>[number];

function greeting(name: string | undefined) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  return name ? `${part}, ${name.split(" ")[0]}` : "The board";
}

export default function BoardPage() {
  const [category, setCategory] = useState<ToolCategory>();
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim().toLowerCase());
  const [requesting, setRequesting] = useState<BoardTool | null>(null);
  const tools = useQuery(api.tools.list, { category });
  const removeTool = useMutation(api.admin.removeTool);
  const { viewer, isAdmin } = useViewer();
  const { run } = useAsyncAction();

  const visible = tools?.filter(
    (tool) =>
      !query ||
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query),
  );

  return (
    <>
      <PageHeader
        title={greeting(viewer?.name)}
        description="What are you fixing, growing or cooking this week?"
        action={
          <label className="relative w-full sm:w-72">
            <span className="sr-only">Search tools</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search drills, tents, mixers…"
              className="border-2 border-ink pl-9"
            />
          </label>
        }
      />
      <NeedsYou />
      <CategoryFilter value={category} onChange={setCategory} />

      {visible === undefined ? (
        <LoadingList />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchX} title="Nothing on these pegs">
          Try another category or search, or list one of your own tools.
        </EmptyState>
      ) : (
        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tool) => (
            <ToolCard
              key={tool._id}
              tool={tool}
              owner={tool.owner}
              meta={tool.isOwn && <Badge tone="info">Yours</Badge>}
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
                      Borrow this
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
