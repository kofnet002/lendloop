import { clsx, type ClassValue } from "clsx";
import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Inline custom properties, e.g. `cssVars({ "--delay": "80ms" })` for staggered animations. */
export function cssVars(vars: Record<`--${string}`, string>) {
  return vars as CSSProperties;
}
