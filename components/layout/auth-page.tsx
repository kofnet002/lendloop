import type { ReactNode } from "react";
import { Brand } from "./brand";

export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <main className="grid flex-1 content-center justify-items-center gap-6 px-4 py-12">
      <Brand />
      {children}
    </main>
  );
}
