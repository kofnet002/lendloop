"use client";

import { SignInButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export function AuthCta({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <>
      <AuthLoading>
        <Button size={size} disabled>
          Loading…
        </Button>
      </AuthLoading>
      <Unauthenticated>
        <SignInButton mode="modal" forceRedirectUrl="/board">
          <Button size={size}>Sign in to lend or borrow</Button>
        </SignInButton>
      </Unauthenticated>
      <Authenticated>
        <Link href="/board" className={buttonVariants({ size })}>
          Open the board
        </Link>
      </Authenticated>
    </>
  );
}
