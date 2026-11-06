"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LoadingList } from "@/components/ui/states";
import { api } from "@/convex/_generated/api";
import { useViewer } from "@/hooks/use-viewer";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";

const NAV = [
  { href: "/board", label: "Board" },
  { href: "/listings", label: "My listings" },
  { href: "/requests", label: "My requests" },
  { href: "/incoming", label: "Incoming" },
] as const;

function useSyncViewer() {
  const sync = useMutation(api.users.sync);
  useEffect(() => {
    void sync();
  }, [sync]);
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const active = usePathname().startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-1.5 border-b-[3px] border-transparent px-3 pt-2 pb-2.5 text-sm font-medium whitespace-nowrap text-[#e6eae4]/70 hover:text-[#e6eae4]",
        active && "border-yellow text-[#e6eae4]",
      )}
    >
      {children}
    </Link>
  );
}

function Navigation() {
  const { isAdmin } = useViewer();
  const incoming = useQuery(api.loans.incoming);
  const pending = incoming?.filter((loan) => loan.status === "requested").length ?? 0;

  return (
    <nav className="-mx-3 -mb-px flex overflow-x-auto px-0" aria-label="Main">
      {NAV.map(({ href, label }) => (
        <NavLink key={href} href={href}>
          {label}
          {href === "/incoming" && pending > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-yellow px-1 text-xs font-bold text-[#1b2733]">
              {pending}
            </span>
          )}
        </NavLink>
      ))}
      {isAdmin && <NavLink href="/admin">Admin</NavLink>}
    </nav>
  );
}

function SignedInShell({ children }: { children: ReactNode }) {
  useSyncViewer();
  return (
    <>
      <header className="sticky top-0 z-10 bg-[#1b2733] shadow-[0_2px_0_var(--yellow)]">
        <div className="mx-auto grid max-w-6xl gap-2 px-4 pt-3 sm:px-6">
          <div className="flex items-center justify-between">
            <Brand inverted />
            <UserButton />
          </div>
          <Navigation />
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-6xl content-start gap-6 px-4 py-8 sm:px-6">
        {children}
      </main>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <LoadingList />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="mx-auto grid max-w-md justify-items-center gap-4 px-4 py-24 text-center">
          <Brand />
          <p className="text-muted">Sign in to lend or borrow tools.</p>
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
        </div>
      </Unauthenticated>
      <Authenticated>
        <SignedInShell>{children}</SignedInShell>
      </Authenticated>
    </>
  );
}
