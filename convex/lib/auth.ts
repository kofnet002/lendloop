import type { Auth, UserIdentity } from "convex/server";
import type { Doc } from "../_generated/dataModel";
import type { DatabaseReader, MutationCtx } from "../_generated/server";
import type { Role } from "./constants";
import { fail } from "./errors";

/** Role comes from the verified Clerk JWT (`role` claim mapped from publicMetadata), never from client input. */
export function roleOf(identity: UserIdentity): Role {
  return identity.role === "admin" ? "admin" : "user";
}

export async function requireIdentity(ctx: { auth: Auth }): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) fail("UNAUTHENTICATED", "Sign in to continue.");
  return identity;
}

export function requireRole(identity: UserIdentity, required: Role): Role {
  const role = roleOf(identity);
  if (required === "admin" && role !== "admin") fail("FORBIDDEN", "Admin access required.");
  return role;
}

export function findUserByToken(db: DatabaseReader, tokenIdentifier: string) {
  return db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
}

function profileFrom(identity: UserIdentity) {
  const email = identity.email;
  const name = identity.name?.trim() || email?.split("@")[0] || "Neighbor";
  return { name, email, role: roleOf(identity) };
}

export async function upsertUser(ctx: MutationCtx, identity: UserIdentity): Promise<Doc<"users">> {
  const profile = profileFrom(identity);
  const existing = await findUserByToken(ctx.db, identity.tokenIdentifier);

  if (!existing) {
    const id = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      isTrustedLender: false,
      ...profile,
    });
    return (await ctx.db.get(id))!;
  }

  const changed =
    existing.name !== profile.name ||
    existing.email !== profile.email ||
    existing.role !== profile.role;
  if (!changed) return existing;

  await ctx.db.patch(existing._id, profile);
  return { ...existing, ...profile };
}
