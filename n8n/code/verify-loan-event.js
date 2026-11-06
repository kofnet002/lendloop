const crypto = require("crypto");
const TOLERANCE_MS = 5 * 60 * 1000;

const item = $input.first();
const headers = item.json.headers ?? {};
const raw = (await this.helpers.getBinaryDataBuffer(0, "data")).toString("utf8");
const timestamp = String(headers["x-lendloop-timestamp"] ?? "");
const signature = String(headers["x-lendloop-signature"] ?? "");
const secret = $env.N8N_WEBHOOK_SECRET;
if (!secret) throw new Error("N8N_WEBHOOK_SECRET is not configured");

const expected = `v1=${crypto.createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")}`;
const fresh = Math.abs(Date.now() - Number(timestamp)) <= TOLERANCE_MS;
const valid =
  fresh &&
  signature.length === expected.length &&
  crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

if (!valid) return [{ json: { valid: false } }];

const event = JSON.parse(raw);
const seen = $getWorkflowStaticData("global").deliveredEventIds ?? [];
return [{ json: { valid: true, duplicate: seen.includes(event.id), event } }];
