import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-display text-2xl leading-none font-extrabold tracking-wide",
        inverted ? "text-[#e6eae4]" : "text-ink",
      )}
    >
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="7" fill="var(--yellow)" />
        <circle cx="13" cy="16" r="6" fill="none" stroke="#1b2733" strokeWidth="3" />
        <circle cx="19" cy="16" r="6" fill="none" stroke="#1b2733" strokeWidth="3" />
      </svg>
      LendLoop
    </Link>
  );
}
