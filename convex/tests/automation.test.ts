import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { signedHeaders, signPayload, verifySignature } from "../lib/signature";
import { createTestEnv, drill, TODAY } from "../test.setup";

const N8N_URL = "https://n8n.test/webhook/lendloop/loan-events";
const N8N_SECRET = "convex-to-n8n-secret";
const API_SECRET = "n8n-to-convex-secret";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  vi.stubEnv("N8N_LOAN_EVENTS_WEBHOOK_URL", N8N_URL);
  vi.stubEnv("N8N_WEBHOOK_SECRET", N8N_SECRET);
  vi.stubEnv("AUTOMATION_API_SECRET", API_SECRET);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function mockN8n(...statuses: number[]) {
  const fetchMock = vi.fn(async () => {
    const status = statuses.length > 1 ? statuses.shift()! : statuses[0];
    return new Response(JSON.stringify({ channel: "log" }), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function signedRequest(path: string, init: { method: string; body?: string }) {
  const body = init.body ?? "";
  return {
    path,
    init: { ...init, headers: await signedHeaders(API_SECRET, body) },
  };
}

async function seedOverdueLoan() {
  const env = createTestEnv();
  mockN8n(200);
  const toolId = await env.alice.mutation(api.tools.create, drill);
  const loanId = await env.bob.mutation(api.loans.request, {
    toolId,
    startDate: "2026-11-06",
    endDate: "2026-11-07",
  });
  await env.alice.mutation(api.loans.approve, { loanId });
  await env.t.finishAllScheduledFunctions(vi.runAllTimers);
  vi.setSystemTime(new Date("2026-11-10T09:00:00Z"));
  return { ...env, loanId };
}

describe("signatures", () => {
  it("verifies untampered payloads within the tolerance window", async () => {
    const now = Date.now();
    const signature = await signPayload("secret", String(now), "{}");
    await expect(
      verifySignature("secret", { timestamp: String(now), signature, body: "{}" }, now),
    ).resolves.toBe(true);
  });

  it.each([
    ["tampered body", { body: '{"x":1}' }],
    ["wrong secret", { secret: "other" }],
    ["stale timestamp", { now: Date.now() + 10 * 60_000 }],
    ["malformed signature", { signature: "v1=zz" }],
  ])("rejects %s", async (_, override: Record<string, unknown>) => {
    const now = Date.now();
    const signature = await signPayload("secret", String(now), "{}");
    const input = { timestamp: String(now), signature, body: "{}", ...override };
    await expect(
      verifySignature(
        (override.secret as string) ?? "secret",
        input as never,
        (override.now as number) ?? now,
      ),
    ).resolves.toBe(false);
  });
});

describe("loan event outbox", () => {
  it("sends a signed, minimal payload to n8n and records delivery", async () => {
    const { t, alice, bob } = createTestEnv();
    const fetchMock = mockN8n(200);
    const toolId = await alice.mutation(api.tools.create, drill);
    await bob.mutation(api.loans.request, {
      toolId,
      startDate: "2026-11-10",
      endDate: "2026-11-11",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(url).toBe(N8N_URL);
    await expect(
      verifySignature(N8N_SECRET, {
        timestamp: headers["x-lendloop-timestamp"],
        signature: headers["x-lendloop-signature"],
        body: init.body as string,
      }),
    ).resolves.toBe(true);

    const payload = JSON.parse(init.body as string);
    expect(payload).toMatchObject({
      type: "loan.requested",
      recipient: { name: "Alice", email: "alice@example.com" },
      loan: { toolName: drill.name, startDate: "2026-11-10", endDate: "2026-11-11" },
    });
    expect(Object.keys(payload).sort()).toEqual(["id", "loan", "occurredAt", "recipient", "type"]);

    const [loan] = await alice.query(api.loans.incoming);
    expect(loan.activity).toMatchObject([
      { eventType: "loan.requested", status: "sent", channel: "log" },
    ]);
  });

  it("retries transient failures with backoff, then succeeds", async () => {
    const { t, alice, bob } = createTestEnv();
    const fetchMock = mockN8n(503, 503, 200);
    const toolId = await alice.mutation(api.tools.create, drill);
    await bob.mutation(api.loans.request, {
      toolId,
      startDate: "2026-11-10",
      endDate: "2026-11-11",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [loan] = await alice.query(api.loans.incoming);
    expect(loan.activity[0].status).toBe("sent");
  });

  it("fails fast on non-retryable responses and surfaces them to admins", async () => {
    const { t, alice, bob, admin } = createTestEnv();
    const fetchMock = mockN8n(401);
    const toolId = await alice.mutation(api.tools.create, drill);
    await bob.mutation(api.loans.request, {
      toolId,
      startDate: "2026-11-10",
      endDate: "2026-11-11",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(fetchMock).toHaveBeenCalledOnce();
    const health = await admin.query(api.admin.automationHealth);
    expect(health.failedEvents).toHaveLength(1);
    expect(health.failedEvents[0].lastError).toMatch(/HTTP 401/);

    mockN8n(200);
    await admin.mutation(api.admin.retryAutomationEvent, { eventId: health.failedEvents[0]._id });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect((await admin.query(api.admin.automationHealth)).failedEvents).toHaveLength(0);
  });

  it("gives up after the maximum number of attempts", async () => {
    const { t, alice, bob, admin } = createTestEnv();
    const fetchMock = mockN8n(500);
    const toolId = await alice.mutation(api.tools.create, drill);
    await bob.mutation(api.loans.request, {
      toolId,
      startDate: "2026-11-10",
      endDate: "2026-11-11",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect((await admin.query(api.admin.automationHealth)).failedEvents[0].attempts).toBe(5);
  });
});

describe("automation HTTP endpoints", () => {
  it("rejects unsigned and tampered requests", async () => {
    const { t } = createTestEnv();
    expect((await t.fetch("/automation/overdue-loans", { method: "GET" })).status).toBe(401);

    const signed = await signedRequest("/automation/failures", { method: "POST", body: "{}" });
    const tampered = await t.fetch(signed.path, { ...signed.init, body: '{"a":1}' });
    expect(tampered.status).toBe(401);
  });

  it("lists overdue loans with only the fields needed for a reminder", async () => {
    const { t, loanId } = await seedOverdueLoan();
    const { path, init } = await signedRequest("/automation/overdue-loans", { method: "GET" });
    const response = await t.fetch(path, init);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      asOf: "2026-11-10",
      loans: [
        {
          loanId,
          reminderKey: `overdue:${loanId}:2026-11-10`,
          toolName: drill.name,
          endDate: "2026-11-07",
          daysOverdue: 3,
          borrower: { name: "Bob", email: "bob@example.com" },
        },
      ],
    });
  });

  it("records reminder write-backs idempotently", async () => {
    const { t, bob, loanId } = await seedOverdueLoan();
    const report = (status: "sent" | "failed") =>
      JSON.stringify({
        reminderKey: `overdue:${loanId}:2026-11-10`,
        loanId,
        status,
        channel: "log",
      });
    const post = async (body: string) => {
      const { path, init } = await signedRequest("/automation/reminders", { method: "POST", body });
      return (await t.fetch(path, init)).json();
    };

    expect(await post(report("failed"))).toEqual({ result: "created" });
    expect(await post(report("sent"))).toEqual({ result: "updated" });
    expect(await post(report("sent"))).toEqual({ result: "unchanged" });
    expect(await post(report("failed"))).toEqual({ result: "unchanged" });

    const reminders = (await bob.query(api.loans.myRequests))[0].activity.filter(
      (event) => event.kind === "overdue_reminder",
    );
    expect(reminders).toMatchObject([{ status: "sent" }]);

    const { path, init } = await signedRequest("/automation/overdue-loans", { method: "GET" });
    expect((await (await t.fetch(path, init)).json()).loans).toHaveLength(0);
  });

  it("validates write-back bodies", async () => {
    const { t, loanId } = await seedOverdueLoan();
    const otherKey = `overdue:${"x" as Id<"loans">}:2026-11-10`;
    const cases = [
      ["not json", 400],
      [JSON.stringify({ loanId }), 400],
      [JSON.stringify({ reminderKey: otherKey, loanId, status: "sent", channel: "log" }), 400],
    ] as const;
    for (const [body, status] of cases) {
      const { path, init } = await signedRequest("/automation/reminders", { method: "POST", body });
      expect((await t.fetch(path, init)).status).toBe(status);
    }
  });

  it("records n8n workflow failures once per execution", async () => {
    const { t, admin } = createTestEnv();
    const body = JSON.stringify({
      workflow: "LendLoop · Overdue reminders",
      executionId: "42",
      node: "Fetch overdue loans",
      message: "ECONNREFUSED",
    });
    for (const expected of ["created", "unchanged"]) {
      const { path, init } = await signedRequest("/automation/failures", { method: "POST", body });
      expect(await (await t.fetch(path, init)).json()).toEqual({ result: expected });
    }
    expect((await admin.query(api.admin.automationHealth)).workflowFailures).toHaveLength(1);
  });

  it("fails closed when the shared secret is not configured", async () => {
    const { t } = createTestEnv();
    const { path, init } = await signedRequest("/automation/overdue-loans", { method: "GET" });
    vi.stubEnv("AUTOMATION_API_SECRET", "");
    expect((await t.fetch(path, init)).status).toBe(503);
  });
});
