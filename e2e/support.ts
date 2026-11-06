import { createClerkClient } from "@clerk/nextjs/server";
import { expect, type Page } from "@playwright/test";
import users from "./users.json" with { type: "json" };

export type Persona = keyof typeof users;

const clerkBackend = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function signInTicket(persona: Persona): Promise<string> {
  const { data } = await clerkBackend.users.getUserList({ emailAddress: [users[persona].email] });
  if (!data[0]) throw new Error(`Missing e2e user "${persona}". Run: npm run setup:clerk`);
  const { token } = await clerkBackend.signInTokens.createSignInToken({
    userId: data[0].id,
    expiresInSeconds: 120,
  });
  return token;
}

/** Redeems a backend-issued sign-in ticket in the page, then waits until Convex accepts the session. */
export async function signInAs(page: Page, persona: Persona, path = "/board") {
  const ticket = await signInTicket(persona);
  await page.goto("/");
  await page.waitForFunction(() => window.Clerk?.loaded);
  await page.evaluate(async (ticket) => {
    await window.Clerk.signOut();
    const attempt = await window.Clerk.client!.signIn.create({ strategy: "ticket", ticket });
    await window.Clerk.setActive({ session: attempt.createdSessionId });
  }, ticket);
  await page.goto(path);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible({ timeout: 15_000 });
}

export function toolTag(page: Page, name: string) {
  return page
    .locator("div.group")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
}

export function loanCard(page: Page, toolName: string) {
  return page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: toolName, exact: true }) });
}
