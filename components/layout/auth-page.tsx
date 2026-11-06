import type { ReactNode } from "react";
import { Brand } from "./brand";

/** The page already shows the brand, so Clerk's card drops its own logo here (modals keep it). */
export const SIGNED_OUT_PAGE = { options: { logoPlacement: "none" } } as const;

export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <main className="grid flex-1 content-center justify-items-center gap-6 px-4 py-12">
      <Brand />
      {children}
    </main>
  );
}
