import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { mutation, query } from "../_generated/server";
import type { Role } from "./constants";
import { findUserByToken, requireIdentity, requireRole, upsertUser } from "./auth";

/**
 * Every authenticated Convex function is built from these wrappers so authentication
 * and role checks cannot be forgotten in individual handlers.
 * Queries may see `viewer: null` before the first sync; mutations always upsert the viewer.
 */
function authedQuery(required: Role) {
  return customQuery(
    query,
    customCtx(async (ctx) => {
      const identity = await requireIdentity(ctx);
      const role = requireRole(identity, required);
      const viewer = await findUserByToken(ctx.db, identity.tokenIdentifier);
      return { role, viewer };
    }),
  );
}

function authedMutation(required: Role) {
  return customMutation(
    mutation,
    customCtx(async (ctx) => {
      const identity = await requireIdentity(ctx);
      const role = requireRole(identity, required);
      const viewer = await upsertUser(ctx, identity);
      return { role, viewer };
    }),
  );
}

export const userQuery = authedQuery("user");
export const userMutation = authedMutation("user");
export const adminQuery = authedQuery("admin");
export const adminMutation = authedMutation("admin");
