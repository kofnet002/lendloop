"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
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
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap text-muted hover:text-foreground",
        active && "bg-accent-soft font-medium text-accent",
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
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1" aria-label="Main">
      {NAV.map(({ href, label }) => (
        <NavLink key={href} href={href}>
          {label}
          {href === "/incoming" && pending > 0 && <Badge tone="warning">{pending}</Badge>}
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
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-5xl gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <Brand />
            <UserButton />
          </div>
          <Navigation />
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
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
