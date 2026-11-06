/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, vi } from "vitest";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.{ts,js}", "!./**/*.*.{ts,js}"]);

export const TODAY = "2026-11-06";

export const identities = {
  alice: { subject: "alice", name: "Alice", email: "alice@example.com" },
  bob: { subject: "bob", name: "Bob", email: "bob@example.com" },
  carol: { subject: "carol", name: "Carol", email: "carol@example.com" },
  admin: { subject: "admin", name: "Admin", email: "admin@example.com", role: "admin" },
};

export function setupClock() {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  });
  afterEach(() => vi.useRealTimers());
}

export function createTestEnv() {
  const t = convexTest(schema, modules);
  return {
    t,
    alice: t.withIdentity(identities.alice),
    bob: t.withIdentity(identities.bob),
    carol: t.withIdentity(identities.carol),
    admin: t.withIdentity(identities.admin),
  };
}

export const drill = {
  name: "Cordless drill",
  category: "power_tools",
  condition: "good",
  description: "18V with two batteries.",
} as const;
