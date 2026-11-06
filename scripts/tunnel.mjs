#!/usr/bin/env node
// Exposes local n8n to the Convex cloud deployment and points Convex at it.
// Reuses a running ngrok tunnel if there is one; set NGROK_DOMAIN for a stable URL.
import { execFileSync, spawn } from "node:child_process";

const N8N_PORT = process.env.N8N_PORT ?? "5678";
const NGROK_API = "http://127.0.0.1:4040/api/tunnels";
const WEBHOOK_PATH = "/webhook/lendloop/loan-events";
const CONVEX_VAR = "N8N_LOAN_EVENTS_WEBHOOK_URL";
const STARTUP_TIMEOUT_MS = 15_000;

async function findTunnel() {
  try {
    const { tunnels } = await (await fetch(NGROK_API)).json();
    return tunnels.find(
      (tunnel) => tunnel.proto === "https" && tunnel.config.addr.endsWith(`:${N8N_PORT}`),
    );
  } catch {
    return undefined;
  }
}

async function waitForTunnel() {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const tunnel = await findTunnel();
    if (tunnel) return tunnel;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("ngrok did not open a tunnel. Is it installed and authenticated?");
}

function pointConvexAt(publicUrl) {
  const webhookUrl = new URL(WEBHOOK_PATH, publicUrl).toString();
  execFileSync("npx", ["convex", "env", "set", CONVEX_VAR, webhookUrl], { stdio: "inherit" });
  console.log(`Convex now delivers loan events to ${webhookUrl}`);
}

const existing = await findTunnel();
if (existing) {
  pointConvexAt(existing.public_url);
  process.exit(0);
}

const domain = process.env.NGROK_DOMAIN;
const ngrok = spawn("ngrok", ["http", N8N_PORT, ...(domain ? [`--url=${domain}`] : [])], {
  stdio: "ignore",
});
ngrok.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => ngrok.kill(signal));

try {
  pointConvexAt((await waitForTunnel()).public_url);
  console.log("Tunnel is up. Press Ctrl+C to close it.");
} catch (error) {
  console.error(error.message);
  ngrok.kill();
}
