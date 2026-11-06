import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-3 rounded-2xl border-2 border-dashed border-line px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-yellow-soft">
        <Icon className="size-6 text-ink" aria-hidden />
      </span>
      <p className="font-display text-2xl font-extrabold tracking-wide">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function LoadingList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-xl bg-line/60" />
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1">
        <h1 className="font-display text-4xl font-extrabold tracking-wide sm:text-5xl">{title}</h1>
        {description && <p className="text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
