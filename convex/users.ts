import type { Doc } from "./_generated/dataModel";
import type { Role } from "./lib/constants";
import { userMutation, userQuery } from "./lib/functions";

function toViewer(user: Doc<"users">, role: Role) {
  return { _id: user._id, name: user.name, role, isTrustedLender: user.isTrustedLender };
}

export const sync = userMutation({
  args: {},
  handler: async (ctx) => toViewer(ctx.viewer, ctx.role),
});

export const me = userQuery({
  args: {},
  handler: async (ctx) => (ctx.viewer ? toViewer(ctx.viewer, ctx.role) : null),
});
