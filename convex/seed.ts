import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { LoanStatus, ToolCategory, ToolCondition } from "./lib/constants";
import { addDays, todayISO } from "./lib/dates";

const NEIGHBORS = [
  { key: "ada", name: "Ada Mensah", email: "ada@lendloop.dev", isTrustedLender: true },
  { key: "ben", name: "Ben Owusu", email: "ben@lendloop.dev", isTrustedLender: false },
  { key: "cy", name: "Cy Boateng", email: "cy@lendloop.dev", isTrustedLender: false },
] as const;

type NeighborKey = (typeof NEIGHBORS)[number]["key"];

const TOOLS: {
  owner: NeighborKey;
  name: string;
  category: ToolCategory;
  condition: ToolCondition;
  description: string;
}[] = [
  {
    owner: "ada",
    name: "Cordless drill",
    category: "power_tools",
    condition: "good",
    description: "18V, two batteries and a bit set.",
  },
  {
    owner: "ada",
    name: "Extension ladder",
    category: "ladders",
    condition: "like_new",
    description: "6 m aluminium ladder.",
  },
  {
    owner: "ben",
    name: "Hedge trimmer",
    category: "garden",
    condition: "fair",
    description: "Electric, 50 cm blade.",
  },
  {
    owner: "ben",
    name: "Two-person tent",
    category: "camping",
    condition: "good",
    description: "Waterproof, packs small.",
  },
  {
    owner: "cy",
    name: "Stand mixer",
    category: "kitchen",
    condition: "like_new",
    description: "With dough hook and whisk.",
  },
  {
    owner: "cy",
    name: "Pressure washer",
    category: "cleaning",
    condition: "worn",
    description: "Works well, hose is a bit short.",
  },
];

const LOANS: {
  tool: string;
  borrower: NeighborKey;
  from: number;
  to: number;
  status: LoanStatus;
}[] = [
  { tool: "Cordless drill", borrower: "ben", from: 2, to: 4, status: "requested" },
  { tool: "Extension ladder", borrower: "cy", from: -1, to: 2, status: "approved" },
  { tool: "Hedge trimmer", borrower: "ada", from: -7, to: -3, status: "approved" },
  { tool: "Stand mixer", borrower: "ben", from: -10, to: -8, status: "returned" },
];

/** Development-only demo data: `npx convex run seed:demo`. Internal, so clients can never call it. */
export const demo = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (await ctx.db.query("tools").first()) return "skipped: database already has data";

    const today = todayISO();
    const users = new Map<NeighborKey, Id<"users">>();
    for (const { key, ...profile } of NEIGHBORS) {
      users.set(
        key,
        await ctx.db.insert("users", { ...profile, tokenIdentifier: `seed|${key}`, role: "user" }),
      );
    }

    const tools = new Map<string, { id: Id<"tools">; owner: Id<"users"> }>();
    for (const { owner, ...tool } of TOOLS) {
      const ownerId = users.get(owner)!;
      tools.set(tool.name, {
        id: await ctx.db.insert("tools", { ...tool, ownerId }),
        owner: ownerId,
      });
    }

    for (const loan of LOANS) {
      const tool = tools.get(loan.tool)!;
      await ctx.db.insert("loans", {
        toolId: tool.id,
        toolName: loan.tool,
        ownerId: tool.owner,
        borrowerId: users.get(loan.borrower)!,
        startDate: addDays(today, loan.from),
        endDate: addDays(today, loan.to),
        status: loan.status,
        ...(loan.status === "returned" ? { returnedAt: Date.now() } : {}),
        ...(loan.status !== "requested" ? { decidedAt: Date.now() } : {}),
      });
    }
    return `seeded ${NEIGHBORS.length} neighbors, ${TOOLS.length} tools, ${LOANS.length} loans`;
  },
});
