import { validate } from "convex-helpers/validators";
import { ConvexError, v, type PropertyValidators, type ObjectType } from "convex/values";
import { httpAction, type ActionCtx } from "../_generated/server";
import type { AppErrorData } from "./errors";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifySignature } from "./signature";

const MAX_BODY_BYTES = 64 * 1024;

export function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorResponse(error: unknown): Response {
  if (error instanceof ConvexError) {
    const { code, message } = error.data as AppErrorData;
    return json(code === "NOT_FOUND" ? 404 : 400, { error: code, message });
  }
  console.error("Automation endpoint failed", error);
  return json(500, { error: "INTERNAL" });
}

/** HTTP endpoints for n8n: HMAC-verified with AUTOMATION_API_SECRET before any work happens. */
export function signedEndpoint(handler: (ctx: ActionCtx, body: string) => Promise<Response>) {
  return httpAction(async (ctx, request) => {
    const secret = process.env.AUTOMATION_API_SECRET;
    if (!secret) {
      console.error("AUTOMATION_API_SECRET is not configured");
      return json(503, { error: "NOT_CONFIGURED" });
    }
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
      return json(413, { error: "PAYLOAD_TOO_LARGE" });
    }

    const body = await request.text();
    const valid = await verifySignature(secret, {
      timestamp: request.headers.get(TIMESTAMP_HEADER),
      signature: request.headers.get(SIGNATURE_HEADER),
      body,
    });
    if (!valid) return json(401, { error: "INVALID_SIGNATURE" });

    try {
      return await handler(ctx, body);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

export function signedJsonEndpoint<Fields extends PropertyValidators>(
  fields: Fields,
  handler: (ctx: ActionCtx, data: ObjectType<Fields>) => Promise<Response>,
) {
  const validator = v.object(fields);
  return signedEndpoint(async (ctx, body) => {
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      return json(400, { error: "INVALID_JSON" });
    }
    if (!validate(validator, data)) return json(400, { error: "INVALID_BODY" });
    return handler(ctx, data);
  });
}
