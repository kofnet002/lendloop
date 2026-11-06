import {
  CookingPot,
  Construction,
  Drill,
  Hammer,
  Package,
  Shovel,
  SprayCan,
  Tent,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { ToolCategory } from "@/convex/lib/constants";
import { cn } from "@/lib/utils";

/** Each category owns a color, like a tool brand; `ink` is the readable foreground on it. */
export const CATEGORY_STYLE: Record<
  ToolCategory,
  { icon: LucideIcon; color: string; ink: string }
> = {
  power_tools: { icon: Drill, color: "#f7c520", ink: "#1b2733" },
  hand_tools: { icon: Hammer, color: "#e4572e", ink: "#fff8f0" },
  garden: { icon: Shovel, color: "#4c9a2a", ink: "#f3fbe9" },
  kitchen: { icon: CookingPot, color: "#f2a5a0", ink: "#1b2733" },
  camping: { icon: Tent, color: "#2e8b8b", ink: "#effafa" },
  cleaning: { icon: SprayCan, color: "#86b8ea", ink: "#1b2733" },
  ladders: { icon: Construction, color: "#f28c28", ink: "#1b2733" },
  other: { icon: Package, color: "#a88bd6", ink: "#1b2733" },
};

export function categoryVars(category: ToolCategory): CSSProperties {
  const { color, ink } = CATEGORY_STYLE[category];
  return { "--cat": color, "--cat-ink": ink } as CSSProperties;
}

export function CategoryIcon({
  category,
  className,
}: {
  category: ToolCategory;
  className?: string;
}) {
  const Icon = CATEGORY_STYLE[category].icon;
  return (
    <span
      style={categoryVars(category)}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-lg bg-(--cat) text-(--cat-ink)",
        className,
      )}
    >
      <Icon className="size-5" strokeWidth={2.25} aria-hidden />
    </span>
  );
}

/** Packaging-style header: the category color with an oversized, cropped tool silhouette. */
export function ToolArt({
  category,
  compact = false,
  className,
}: {
  category: ToolCategory;
  compact?: boolean;
  className?: string;
}) {
  const Icon = CATEGORY_STYLE[category].icon;
  return (
    <div
      style={categoryVars(category)}
      className={cn("relative overflow-hidden bg-(--cat) text-(--cat-ink)", className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgb(0_0_0/0.13)_2px,transparent_2.5px)] bg-size-[18px_18px]" />
      <Icon
        className={cn(
          "absolute rotate-[-14deg] opacity-90 transition-transform duration-300 group-hover:rotate-[-6deg]",
          compact ? "-right-3 -bottom-5 size-20" : "-right-6 -bottom-8 size-40",
        )}
        strokeWidth={1.6}
      />
    </div>
  );
}
