import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const toneColor = {
  neutral: "text-stamp-grey",
  success: "text-stamp-green",
  info: "text-stamp-blue",
  warning: "text-[#9a6a00] dark:text-yellow",
  danger: "text-stamp-red",
} as const;

export type BadgeTone = keyof typeof toneColor;

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-current/30 ring-inset",
  { variants: { tone: toneColor }, defaultVariants: { tone: "neutral" } },
);

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** Rubber-stamp status mark: the board's primary status signal. */
export function Stamp({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return <span className={cn("stamp", toneColor[tone], className)} {...props} />;
}
