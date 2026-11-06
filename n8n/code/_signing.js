const crypto = require("crypto");

function signedHeaders(body) {
  const secret = $env.AUTOMATION_API_SECRET;
  if (!secret) throw new Error("AUTOMATION_API_SECRET is not configured");
  const timestamp = String(Date.now());
  const digest = crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return { "x-lendloop-timestamp": timestamp, "x-lendloop-signature": `v1=${digest}` };
}

function signed(payload) {
  const body = payload === undefined ? "" : JSON.stringify(payload);
  return { body, headers: signedHeaders(body) };
}
