"use client";

import { SignInButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export function AuthCta({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const label = size === "sm" ? "Sign in" : "Sign in to lend or borrow";
  return (
    <>
      <AuthLoading>
        <Link href="/sign-in" className={buttonVariants({ size })}>
          {label}
        </Link>
      </AuthLoading>
      <Unauthenticated>
        <SignInButton mode="modal" withSignUp forceRedirectUrl="/board">
          <Button size={size}>{label}</Button>
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
