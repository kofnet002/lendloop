import type { Doc, Id } from "../_generated/dataModel";
import type { DatabaseReader } from "../_generated/server";
import { fail } from "./errors";

export type PublicProfile = { name: string; isTrustedLender: boolean };

export async function loadUsers(
  db: DatabaseReader,
  ids: Iterable<Id<"users">>,
): Promise<Map<Id<"users">, Doc<"users">>> {
  const unique = [...new Set(ids)];
  const users = await Promise.all(unique.map((id) => db.get(id)));
  return new Map(users.flatMap((user) => (user ? [[user._id, user] as const] : [])));
}

export function publicProfile(user: Doc<"users"> | undefined): PublicProfile {
  return { name: user?.name ?? "Former neighbor", isTrustedLender: user?.isTrustedLender ?? false };
}

export function assertSelf(expected: Id<"users">, viewer: Doc<"users">, message: string): void {
  if (expected !== viewer._id) fail("FORBIDDEN", message);
}
