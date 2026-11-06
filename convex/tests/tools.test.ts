import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { createTestEnv, drill, setupClock } from "../test.setup";

setupClock();

describe("tools", () => {
  it("rejects unauthenticated writes", async () => {
    const { t } = createTestEnv();
    await expect(t.mutation(api.tools.create, drill)).rejects.toThrow(/Sign in/);
  });

  it("validates listing input", async () => {
    const { alice } = createTestEnv();
    await expect(alice.mutation(api.tools.create, { ...drill, name: " x " })).rejects.toThrow(
      /Name must be/,
    );
  });

  it("only lets owners edit or delete their listings", async () => {
    const { alice, bob } = createTestEnv();
    const toolId = await alice.mutation(api.tools.create, drill);

    await expect(
      bob.mutation(api.tools.update, { toolId, ...drill, name: "Mine now" }),
    ).rejects.toThrow(/only edit your own/);
    await expect(bob.mutation(api.tools.remove, { toolId })).rejects.toThrow(
      /only delete your own/,
    );

    await alice.mutation(api.tools.update, { toolId, ...drill, name: "Impact drill" });
    expect((await alice.query(api.tools.mine))[0].name).toBe("Impact drill");
  });

  it("lets admins remove any listing but not regular users via admin API", async () => {
    const { alice, bob, admin } = createTestEnv();
    const toolId = await alice.mutation(api.tools.create, drill);

    await expect(bob.mutation(api.admin.removeTool, { toolId })).rejects.toThrow(
      /Admin access required/,
    );
    await admin.mutation(api.admin.removeTool, { toolId });
    expect(await alice.query(api.tools.mine)).toHaveLength(0);
  });

  it("exposes only name and category of available tools publicly", async () => {
    const { t, alice, bob } = createTestEnv();
    const toolId = await alice.mutation(api.tools.create, drill);
    await alice.mutation(api.tools.create, { ...drill, name: "Rake", category: "garden" });

    const loanId = await bob.mutation(api.loans.request, {
      toolId,
      startDate: "2026-11-06",
      endDate: "2026-11-08",
    });
    await alice.mutation(api.loans.approve, { loanId });

    const publicTools = await t.query(api.tools.listPublic);
    expect(publicTools).toHaveLength(1);
    expect(Object.keys(publicTools[0]).sort()).toEqual(["_id", "category", "name"]);
    expect(publicTools[0].name).toBe("Rake");
  });

  it("blocks owners from deleting a tool with an approved loan", async () => {
    const { alice, bob } = createTestEnv();
    const toolId = await alice.mutation(api.tools.create, drill);
    const loanId = await bob.mutation(api.loans.request, {
      toolId,
      startDate: "2026-11-10",
      endDate: "2026-11-12",
    });
    await alice.mutation(api.loans.approve, { loanId });

    await expect(alice.mutation(api.tools.remove, { toolId })).rejects.toThrow(
      /active or upcoming/,
    );
  });
});
