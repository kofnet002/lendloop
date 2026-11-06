import { Repeat } from "lucide-react";
import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Repeat className="size-4" aria-hidden />
      </span>
      LendLoop
    </Link>
  );
}
