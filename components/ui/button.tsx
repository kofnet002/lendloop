import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-stamp-blue disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "press bg-yellow text-[#1b2733] hover:brightness-105",
        secondary: "press bg-surface text-ink hover:bg-paper",
        ghost: "text-ink hover:bg-ink/5",
        danger: "press bg-stamp-red text-white hover:brightness-110",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
