#!/usr/bin/env node
/**
 * Generates importable n8n workflow JSON from ./code/*.js so Code-node logic is reviewed as
 * plain JavaScript. Output contains no secrets: they are read at runtime from $env and n8n credentials.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, "workflows");
const source = (file) => readFileSync(join(root, "code", file), "utf8").trim();
const SIGNING = source("_signing.js");

const IDS = {
  loanEvents: "lendloopEvents01",
  overdue: "lendloopOverdue1",
  errors: "lendloopErrors01",
};

const RESEND_CREDENTIAL = { httpHeaderAuth: { id: "lendloopResendApi", name: "Resend API" } };
const RETRY = { retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 };

function stableId(...parts) {
  const hex = createHash("sha256").update(parts.join("/")).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

const node = (name, type, typeVersion, parameters, extra = {}) => ({
  name,
  type,
  typeVersion,
  parameters,
  ...extra,
});

const code = (name, file, { signing = false, perItem = false } = {}) =>
  node(name, "n8n-nodes-base.code", 2, {
    mode: perItem ? "runOnceForEachItem" : "runOnceForAllItems",
    jsCode: signing ? `${SIGNING}\n\n${source(file)}` : source(file),
  });

const condition = (name, expression) =>
  node(name, "n8n-nodes-base.if", 2, {
    conditions: {
      options: { caseSensitive: true, leftValue: "", typeValidation: "loose" },
      conditions: [
        {
          id: stableId(name, "condition"),
          leftValue: expression,
          rightValue: "",
          operator: { type: "boolean", operation: "true", singleValue: true },
        },
      ],
      combinator: "and",
    },
    options: {},
  });

const respond = (name, responseCode, body) =>
  node(name, "n8n-nodes-base.respondToWebhook", 1.1, {
    respondWith: "json",
    responseBody: body,
    options: { responseCode },
  });

const httpRequest = (name, parameters, extra = {}) =>
  node(
    name,
    "n8n-nodes-base.httpRequest",
    4.2,
    { ...parameters, options: { timeout: 10000 } },
    { ...RETRY, ...extra },
  );

const convexRequest = (name, method, path) =>
  httpRequest(name, {
    method,
    url: `={{ $env.CONVEX_SITE_URL }}${path}`,
    sendHeaders: true,
    specifyHeaders: "json",
    jsonHeaders: "={{ JSON.stringify($json.headers) }}",
    ...(method === "POST"
      ? {
          sendBody: true,
          contentType: "raw",
          rawContentType: "application/json",
          body: "={{ $json.body }}",
        }
      : {}),
  });

const sendEmail = (name, extra = {}) =>
  httpRequest(
    name,
    {
      method: "POST",
      url: "https://api.resend.com/emails",
      authentication: "genericCredentialType",
      genericAuthType: "httpHeaderAuth",
      sendBody: true,
      specifyBody: "json",
      jsonBody:
        "={{ JSON.stringify({ from: $env.LENDLOOP_EMAIL_FROM, to: [$json.to], subject: $json.subject, text: $json.text }) }}",
    },
    { credentials: RESEND_CREDENTIAL, ...extra },
  );

const emailEnabled = (name) =>
  condition(name, "={{ $env.LENDLOOP_EMAIL_ENABLED === 'true' && Boolean($json.to) }}");

/** `graph` rows lay nodes out left-to-right; `links` are [from, to, outputIndex?]. */
function workflow({ id, name, graph, links, errorWorkflow = true }) {
  const nodes = graph
    .flatMap((row, y) =>
      row.map(
        (entry, x) =>
          entry && {
            ...entry,
            id: stableId(id, entry.name),
            position: [x * 260, y * 200],
            ...(entry.type === "n8n-nodes-base.webhook"
              ? { webhookId: stableId(id, "webhook") }
              : {}),
          },
      ),
    )
    .filter(Boolean);

  const connections = {};
  for (const [from, to, output = 0] of links) {
    const outputs = (connections[from] ??= { main: [] }).main;
    while (outputs.length <= output) outputs.push([]);
    outputs[output].push({ node: to, type: "main", index: 0 });
  }

  return {
    id,
    name,
    active: false,
    nodes,
    connections,
    pinData: {},
    settings: {
      executionOrder: "v1",
      saveManualExecutions: true,
      saveDataErrorExecution: "all",
      saveDataSuccessExecution: "all",
      ...(errorWorkflow ? { errorWorkflow: IDS.errors } : {}),
    },
  };
}

const loanEvents = workflow({
  id: IDS.loanEvents,
  name: "LendLoop · Loan event notifications",
  graph: [
    [
      node("Loan event webhook", "n8n-nodes-base.webhook", 2, {
        httpMethod: "POST",
        path: "lendloop/loan-events",
        responseMode: "responseNode",
        options: { rawBody: true },
      }),
      code("Verify signature", "verify-loan-event.js"),
      condition("Signature valid?", "={{ $json.valid }}"),
      condition("Already delivered?", "={{ $json.duplicate }}"),
      code("Compose message", "compose-loan-message.js"),
      emailEnabled("Email enabled?"),
      sendEmail("Send email"),
      code("Remember event", "remember-loan-event.js"),
      respond(
        "Respond delivered",
        200,
        "={{ JSON.stringify({ status: $json.status, channel: $json.channel }) }}",
      ),
    ],
    [
      null,
      null,
      respond("Reject signature", 401, '={{ JSON.stringify({ error: "INVALID_SIGNATURE" }) }}'),
      respond("Acknowledge duplicate", 200, '={{ JSON.stringify({ status: "duplicate" }) }}'),
      null,
      null,
      code("Log notification", "log-notification.js"),
    ],
  ],
  links: [
    ["Loan event webhook", "Verify signature"],
    ["Verify signature", "Signature valid?"],
    ["Signature valid?", "Already delivered?", 0],
    ["Signature valid?", "Reject signature", 1],
    ["Already delivered?", "Acknowledge duplicate", 0],
    ["Already delivered?", "Compose message", 1],
    ["Compose message", "Email enabled?"],
    ["Email enabled?", "Send email", 0],
    ["Email enabled?", "Log notification", 1],
    ["Send email", "Remember event"],
    ["Log notification", "Remember event"],
    ["Remember event", "Respond delivered"],
  ],
});

const overdue = workflow({
  id: IDS.overdue,
  name: "LendLoop · Overdue reminders",
  graph: [
    [
      node("Every day at 08:00 UTC", "n8n-nodes-base.scheduleTrigger", 1.2, {
        rule: { interval: [{ field: "cronExpression", expression: "0 8 * * *" }] },
      }),
      code("Sign fetch request", "sign-fetch-overdue.js", { signing: true }),
      convexRequest("Fetch overdue loans", "GET", "/automation/overdue-loans"),
      code("Compose reminders", "compose-reminders.js"),
      emailEnabled("Email enabled?"),
      sendEmail("Send reminder email", { onError: "continueRegularOutput" }),
      code("Email result", "email-result.js", { perItem: true }),
      code("Sign write-backs", "sign-reminder-writebacks.js", { signing: true }),
      convexRequest("Write back reminder status", "POST", "/automation/reminders"),
    ],
    [
      node("Run manually", "n8n-nodes-base.manualTrigger", 1, {}),
      null,
      null,
      null,
      null,
      code("Log notification", "log-notification.js"),
    ],
  ],
  links: [
    ["Every day at 08:00 UTC", "Sign fetch request"],
    ["Run manually", "Sign fetch request"],
    ["Sign fetch request", "Fetch overdue loans"],
    ["Fetch overdue loans", "Compose reminders"],
    ["Compose reminders", "Email enabled?"],
    ["Email enabled?", "Send reminder email", 0],
    ["Email enabled?", "Log notification", 1],
    ["Send reminder email", "Email result"],
    ["Email result", "Sign write-backs"],
    ["Log notification", "Sign write-backs"],
    ["Sign write-backs", "Write back reminder status"],
  ],
});

const errors = workflow({
  id: IDS.errors,
  name: "LendLoop · Error handler",
  errorWorkflow: false,
  graph: [
    [
      node("On workflow error", "n8n-nodes-base.errorTrigger", 1, {}),
      code("Build failure report", "build-failure-report.js", { signing: true }),
      convexRequest("Report failure to Convex", "POST", "/automation/failures"),
    ],
  ],
  links: [
    ["On workflow error", "Build failure report"],
    ["Build failure report", "Report failure to Convex"],
  ],
});

mkdirSync(outDir, { recursive: true });
for (const [file, definition] of [
  ["loan-event-notifications.json", loanEvents],
  ["overdue-reminders.json", overdue],
  ["error-handler.json", errors],
]) {
  writeFileSync(join(outDir, file), `${JSON.stringify(definition, null, 2)}\n`);
  console.log(`wrote workflows/${file}`);
}
