#!/usr/bin/env node
/**
 * Idempotently prepares a Clerk *development* instance for LendLoop:
 * the `convex` JWT template (with role/email/name claims) and the e2e test users.
 * Usage: node --env-file=.env.local scripts/setup-clerk-dev.mjs
 */
import { readFileSync } from "node:fs";

const API = "https://api.clerk.com/v1";
const secret = process.env.CLERK_SECRET_KEY;
if (!secret?.startsWith("sk_test_")) {
  console.error("CLERK_SECRET_KEY must be a development key (sk_test_…).");
  process.exit(1);
}

const TEMPLATE = {
  name: "convex",
  lifetime: 3600,
  allowed_clock_skew: 5,
  claims: {
    aud: "convex",
    name: "{{user.full_name}}",
    email: "{{user.primary_email_address}}",
    role: "{{user.public_metadata.role}}",
  },
};

async function clerk(path, init = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(`${init.method ?? "GET"} ${path}: ${JSON.stringify(body.errors ?? body)}`);
  return body;
}

async function ensureTemplate() {
  const existing = (await clerk("/jwt_templates")).find(
    (template) => template.name === TEMPLATE.name,
  );
  const body = JSON.stringify(TEMPLATE);
  if (existing) await clerk(`/jwt_templates/${existing.id}`, { method: "PATCH", body });
  else await clerk("/jwt_templates", { method: "POST", body });
  console.log(`JWT template "convex" ${existing ? "updated" : "created"}`);
}

async function ensureUser({ email, firstName, lastName, role }) {
  const publicMetadata = role ? { role } : {};
  const [existing] = await clerk(`/users?email_address=${encodeURIComponent(email)}`);
  if (existing) {
    await clerk(`/users/${existing.id}/metadata`, {
      method: "PATCH",
      body: JSON.stringify({ public_metadata: publicMetadata }),
    });
    console.log(`user ${email} ready`);
    return;
  }
  await clerk("/users", {
    method: "POST",
    body: JSON.stringify({
      email_address: [email],
      first_name: firstName,
      last_name: lastName,
      public_metadata: publicMetadata,
      skip_password_requirement: true,
    }),
  });
  console.log(`user ${email} created`);
}

const users = JSON.parse(readFileSync(new URL("../e2e/users.json", import.meta.url), "utf8"));
await ensureTemplate();
for (const user of Object.values(users)) await ensureUser(user);

const domain = Buffer.from(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.split("_")[2] ?? "",
  "base64",
)
  .toString()
  .replace(/\$$/, "");
if (domain) console.log(`\nNext: npx convex env set CLERK_JWT_ISSUER_DOMAIN https://${domain}`);
