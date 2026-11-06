"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hand, Inbox, LayoutGrid, Package, ShieldCheck } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LoadingList } from "@/components/ui/states";
import { api } from "@/convex/_generated/api";
import { useViewer } from "@/hooks/use-viewer";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";

const NAV = [
  { href: "/board", label: "Board", short: "Board", icon: LayoutGrid },
  { href: "/listings", label: "My listings", short: "Listings", icon: Package },
  { href: "/requests", label: "My requests", short: "Requests", icon: Hand },
  { href: "/incoming", label: "Incoming", short: "Incoming", icon: Inbox },
] as const;

const ADMIN_NAV = { href: "/admin", label: "Admin", short: "Admin", icon: ShieldCheck };

function useSyncViewer() {
  const sync = useMutation(api.users.sync);
  useEffect(() => {
    void sync();
  }, [sync]);
}

function useNavItems() {
  const { isAdmin } = useViewer();
  const incoming = useQuery(api.loans.incoming);
  const pending = incoming?.filter((loan) => loan.status === "requested").length ?? 0;
  const items = isAdmin ? [...NAV, ADMIN_NAV] : NAV;
  return items.map((item) => ({ ...item, count: item.href === "/incoming" ? pending : 0 }));
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname.startsWith(href);
}

function Count({ value, className }: { value: number; className?: string }) {
  if (value === 0) return null;
  return (
    <span
      className={cn(
        "grid h-5 min-w-5 place-items-center rounded-full bg-yellow px-1 text-xs font-bold text-navy",
        className,
      )}
    >
      {value}
    </span>
  );
}

function Navigation() {
  const items = useNavItems();
  const isActive = useIsActive();

  return (
    <nav className="-mx-3.5 hidden gap-1 sm:flex" aria-label="Main">
      {items.map(({ href, label, count }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-1.5 rounded-t-lg px-3.5 pt-2 pb-2.5 text-sm font-medium whitespace-nowrap text-chalk/75 transition-colors hover:bg-chalk/10 hover:text-chalk",
            isActive(href) && "bg-yellow font-semibold text-navy hover:bg-yellow hover:text-navy",
          )}
        >
          {label}
          <Count value={count} className={cn(isActive(href) && "bg-navy text-yellow")} />
        </Link>
      ))}
    </nav>
  );
}

/** Phone navigation: a thumb-reachable tab bar pinned to the bottom of the screen. */
function TabBar() {
  const items = useNavItems();
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-yellow bg-navy pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="flex">
        {items.map(({ href, short, icon: Icon, count }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "relative grid justify-items-center gap-1 py-2 text-[11px] font-medium text-chalk/65",
                isActive(href) && "text-yellow",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-12 place-items-center rounded-full transition-colors",
                  isActive(href) && "bg-yellow text-navy",
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
              </span>
              {short}
              <Count
                value={count}
                className="absolute top-1 left-1/2 ml-2 h-4 min-w-4 text-[10px]"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Frame({
  account,
  navigation,
  children,
}: {
  account?: ReactNode;
  navigation: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-30 bg-navy">
        <div className="mx-auto grid max-w-6xl gap-1 px-4 py-2.5 sm:px-6 sm:pb-0">
          <div className="flex h-10 items-center justify-between">
            <Brand inverted />
            {account}
          </div>
          {navigation}
        </div>
        <div className="hazard h-1.5 border-t-[3px] border-yellow" aria-hidden />
      </header>
      <main className="mx-auto grid w-full max-w-6xl content-start gap-6 px-4 pt-6 pb-28 sm:px-6 sm:py-8">
        {children}
      </main>
    </>
  );
}

function SignedInShell({ children }: { children: ReactNode }) {
  useSyncViewer();
  return (
    <>
      <Frame account={<UserButton />} navigation={<Navigation />}>
        {children}
      </Frame>
      <TabBar />
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <Frame navigation={<div className="hidden h-[42px] sm:block" aria-hidden />}>
          <LoadingList />
        </Frame>
      </AuthLoading>
      <Unauthenticated>
        <div className="mx-auto grid max-w-md justify-items-center gap-4 px-4 py-24 text-center">
          <Brand />
          <p className="text-muted">Sign in to lend or borrow tools.</p>
          <SignInButton mode="modal" withSignUp>
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
