import { AUTOMATION } from "./constants";

export const SIGNATURE_HEADER = "x-lendloop-signature";
export const TIMESTAMP_HEADER = "x-lendloop-timestamp";
const VERSION = "v1";

const encoder = new TextEncoder();

function importKey(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^(?:[0-9a-f]{2})+$/.test(hex)) return null;
  return new Uint8Array(hex.match(/../g)!.map((pair) => parseInt(pair, 16)));
}

/** Signs `${timestamp}.${body}` so a captured signature cannot be replayed with another payload or time. */
export async function signPayload(
  secret: string,
  timestamp: string,
  body: string,
): Promise<string> {
  const key = await importKey(secret, "sign");
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${body}`));
  return `${VERSION}=${toHex(mac)}`;
}

export async function signedHeaders(secret: string, body: string, now = Date.now()) {
  const timestamp = String(now);
  return {
    [TIMESTAMP_HEADER]: timestamp,
    [SIGNATURE_HEADER]: await signPayload(secret, timestamp, body),
  };
}

export async function verifySignature(
  secret: string,
  {
    timestamp,
    signature,
    body,
  }: { timestamp: string | null; signature: string | null; body: string },
  now = Date.now(),
): Promise<boolean> {
  if (!timestamp || !signature?.startsWith(`${VERSION}=`)) return false;
  const sentAt = Number(timestamp);
  if (!Number.isSafeInteger(sentAt) || Math.abs(now - sentAt) > AUTOMATION.signatureToleranceMs)
    return false;

  const mac = fromHex(signature.slice(VERSION.length + 1));
  if (!mac) return false;
  const key = await importKey(secret, "verify");
  return crypto.subtle.verify("HMAC", key, mac, encoder.encode(`${timestamp}.${body}`));
}
