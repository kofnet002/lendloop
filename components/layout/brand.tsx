import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

export function Brand({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="LendLoop home"
      className={cn(
        "group flex items-center gap-2 font-display text-2xl leading-none font-bold tracking-tight",
        inverted ? "text-chalk" : "text-navy dark:text-chalk",
        className,
      )}
    >
      <LogoMark
        className="size-10"
        loopClassName={cn("loop-spin loop-spin-hover", inverted ? "neon" : "neon-dark")}
      />
      <span>
        Lend<span className={cn("text-yellow", inverted && "neon-text")}>Loop</span>
      </span>
    </Link>
  );
}
