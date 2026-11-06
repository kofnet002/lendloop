"use client";

import { useQuery } from "convex/react";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingList } from "@/components/ui/states";
import { api } from "@/convex/_generated/api";
import { CATEGORY_LABELS } from "@/lib/labels";

export function PublicToolList() {
  const tools = useQuery(api.tools.listPublic);

  if (tools === undefined) return <LoadingList rows={2} />;
  if (tools.length === 0) {
    return (
      <EmptyState icon={Wrench} title="Nothing to borrow yet">
        Be the first neighbor to list a tool.
      </EmptyState>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <li
          key={tool._id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
        >
          <span className="truncate font-medium">{tool.name}</span>
          <Badge>{CATEGORY_LABELS[tool.category]}</Badge>
        </li>
      ))}
    </ul>
  );
}
