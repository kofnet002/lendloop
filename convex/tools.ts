import { v } from "convex/values";
import { query } from "./_generated/server";
import { LIMITS } from "./lib/constants";
import { todayISO } from "./lib/dates";
import { fail } from "./lib/errors";
import { userMutation, userQuery } from "./lib/functions";
import {
  activeTools,
  approvedLoans,
  archiveTool,
  getAvailability,
  normalizeToolInput,
  pendingLoans,
  requireActiveTool,
} from "./lib/tools";
import { assertSelf, loadUsers, publicProfile } from "./lib/users";
import { vToolCategory, vToolCondition } from "./lib/validators";

const toolFields = {
  name: v.string(),
  category: vToolCategory,
  condition: vToolCondition,
  description: v.string(),
};

/** Public landing page: available tools only, without owner details. */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const today = todayISO();
    const tools = await activeTools(ctx.db).take(LIMITS.listSize);
    const rows = await Promise.all(
      tools.map(async (tool) => ({
        tool,
        availability: await getAvailability(ctx.db, tool._id, today),
      })),
    );
    return rows
      .filter(({ availability }) => availability.state === "available")
      .map(({ tool }) => ({ _id: tool._id, name: tool.name, category: tool.category }));
  },
});

export const list = userQuery({
  args: { category: v.optional(vToolCategory) },
  handler: async (ctx, { category }) => {
    const today = todayISO();
    const tools = await activeTools(ctx.db, category).take(LIMITS.listSize);
    const owners = await loadUsers(
      ctx.db,
      tools.map((tool) => tool.ownerId),
    );
    return Promise.all(
      tools.map(async (tool) => ({
        _id: tool._id,
        _creationTime: tool._creationTime,
        name: tool.name,
        category: tool.category,
        condition: tool.condition,
        description: tool.description,
        isOwn: tool.ownerId === ctx.viewer?._id,
        owner: publicProfile(owners.get(tool.ownerId)),
        availability: await getAvailability(ctx.db, tool._id, today),
      })),
    );
  },
});

export const mine = userQuery({
  args: {},
  handler: async (ctx) => {
    const viewer = ctx.viewer;
    if (!viewer) return [];
    const today = todayISO();
    const tools = await ctx.db
      .query("tools")
      .withIndex("by_owner_removed", (q) => q.eq("ownerId", viewer._id).eq("removedAt", undefined))
      .order("desc")
      .take(LIMITS.listSize);
    return Promise.all(
      tools.map(async (tool) => ({
        ...tool,
        availability: await getAvailability(ctx.db, tool._id, today),
        pendingRequests: (await pendingLoans(ctx.db, tool._id)).length,
      })),
    );
  },
});

export const create = userMutation({
  args: toolFields,
  handler: async (ctx, args) => {
    return ctx.db.insert("tools", { ...normalizeToolInput(args), ownerId: ctx.viewer._id });
  },
});

export const update = userMutation({
  args: { toolId: v.id("tools"), ...toolFields },
  handler: async (ctx, { toolId, ...input }) => {
    const tool = await requireActiveTool(ctx.db, toolId);
    assertSelf(tool.ownerId, ctx.viewer, "You can only edit your own listings.");
    await ctx.db.patch(toolId, normalizeToolInput(input));
  },
});

export const remove = userMutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    const tool = await requireActiveTool(ctx.db, toolId);
    assertSelf(tool.ownerId, ctx.viewer, "You can only delete your own listings.");
    if ((await approvedLoans(ctx.db, toolId)).length > 0) {
      fail("CONFLICT", "This tool has an active or upcoming loan. Mark it returned first.");
    }
    await archiveTool(ctx, tool, ctx.viewer._id);
  },
});
