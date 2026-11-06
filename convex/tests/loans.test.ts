import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { createTestEnv, drill, setupClock } from "../test.setup";

setupClock();

async function seedRequest(startDate = "2026-11-10", endDate = "2026-11-12") {
  const env = createTestEnv();
  const toolId = await env.alice.mutation(api.tools.create, drill);
  const loanId = await env.bob.mutation(api.loans.request, { toolId, startDate, endDate });
  return { ...env, toolId, loanId };
}

describe("loan requests", () => {
  it("prevents borrowing your own tool", async () => {
    const { alice } = createTestEnv();
    const toolId = await alice.mutation(api.tools.create, drill);
    await expect(
      alice.mutation(api.loans.request, { toolId, startDate: "2026-11-10", endDate: "2026-11-11" }),
    ).rejects.toThrow(/your own tool/);
  });

  it.each([
    ["2026-11-01", "2026-11-03", /in the past/],
    ["2026-11-12", "2026-11-10", /after start/],
    ["2026-11-10", "2026-12-10", /at most 14 days/],
    ["2026-02-30", "2026-03-01", /valid calendar/],
  ])("rejects invalid range %s → %s", async (startDate, endDate, error) => {
    const { alice, bob } = createTestEnv();
    const toolId = await alice.mutation(api.tools.create, drill);
    await expect(bob.mutation(api.loans.request, { toolId, startDate, endDate })).rejects.toThrow(
      error,
    );
  });

  it("rejects duplicate pending requests from the same borrower", async () => {
    const { bob, toolId } = await seedRequest();
    await expect(
      bob.mutation(api.loans.request, { toolId, startDate: "2026-11-11", endDate: "2026-11-13" }),
    ).rejects.toThrow(/already have a pending/);
  });
});

describe("loan actions", () => {
  it("only lets the owner approve, decline and mark returned", async () => {
    const { bob, carol, loanId } = await seedRequest();
    await expect(bob.mutation(api.loans.approve, { loanId })).rejects.toThrow(/cannot perform/);
    await expect(carol.mutation(api.loans.approve, { loanId })).rejects.toThrow(/not found/);
    await expect(carol.mutation(api.loans.decline, { loanId })).rejects.toThrow(/not found/);
  });

  it("only lets the borrower cancel", async () => {
    const { alice, bob, loanId } = await seedRequest();
    await expect(alice.mutation(api.loans.cancel, { loanId })).rejects.toThrow(/cannot perform/);
    await bob.mutation(api.loans.cancel, { loanId });
    expect((await bob.query(api.loans.myRequests))[0].status).toBe("cancelled");
  });

  it("approving declines competing overlapping requests and blocks new ones", async () => {
    const { alice, carol, toolId, loanId } = await seedRequest();
    const competingId = await carol.mutation(api.loans.request, {
      toolId,
      startDate: "2026-11-12",
      endDate: "2026-11-14",
    });

    await alice.mutation(api.loans.approve, { loanId });

    const incoming = await alice.query(api.loans.incoming);
    expect(incoming.find((loan) => loan._id === competingId)?.status).toBe("declined");
    await expect(
      carol.mutation(api.loans.request, { toolId, startDate: "2026-11-11", endDate: "2026-11-11" }),
    ).rejects.toThrow(/already booked/);
  });

  it("rejects invalid transitions", async () => {
    const { alice, loanId } = await seedRequest("2026-11-06", "2026-11-07");
    await expect(alice.mutation(api.loans.markReturned, { loanId })).rejects.toThrow(
      /already requested/,
    );
    await alice.mutation(api.loans.approve, { loanId });
    await expect(alice.mutation(api.loans.decline, { loanId })).rejects.toThrow(/already approved/);
    await alice.mutation(api.loans.markReturned, { loanId });
    expect((await alice.query(api.loans.incoming))[0].status).toBe("returned");
  });

  it("does not allow returning a loan before it starts", async () => {
    const { alice, loanId } = await seedRequest();
    await alice.mutation(api.loans.approve, { loanId });
    await expect(alice.mutation(api.loans.markReturned, { loanId })).rejects.toThrow(/not started/);
  });

  it("declines open requests when a listing is removed", async () => {
    const { alice, bob, toolId } = await seedRequest();
    await alice.mutation(api.tools.remove, { toolId });
    expect((await bob.query(api.loans.myRequests))[0].status).toBe("declined");
  });
});

describe("admin", () => {
  it("restricts loan overview and trusted lender flag to admins", async () => {
    const { t, alice, admin } = await seedRequest();
    await expect(alice.query(api.admin.loans, {})).rejects.toThrow(/Admin access required/);
    expect(await admin.query(api.admin.loans, {})).toHaveLength(1);

    const aliceId = (await alice.query(api.users.me))!._id;
    await expect(
      alice.mutation(api.admin.setTrustedLender, { userId: aliceId, trusted: true }),
    ).rejects.toThrow(/Admin access required/);
    await admin.mutation(api.admin.setTrustedLender, { userId: aliceId, trusted: true });

    const board = await t.withIdentity({ subject: "dave" }).query(api.tools.list, {});
    expect(board[0].owner).toEqual({ name: "Alice", isTrustedLender: true });
  });

  it("derives the admin role from the token, not the database", async () => {
    const { t } = createTestEnv();
    await t.withIdentity({ subject: "eve", role: "admin" }).mutation(api.users.sync);
    await expect(t.withIdentity({ subject: "eve" }).query(api.admin.users, {})).rejects.toThrow(
      /Admin access required/,
    );
  });
});
