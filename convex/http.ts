import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { failureReport, reminderReport } from "./automation";
import { json, signedEndpoint, signedJsonEndpoint } from "./lib/http";

const http = httpRouter();

http.route({
  path: "/automation/overdue-loans",
  method: "GET",
  handler: signedEndpoint(async (ctx) =>
    json(200, await ctx.runQuery(internal.automation.overdueLoans, {})),
  ),
});

http.route({
  path: "/automation/reminders",
  method: "POST",
  handler: signedJsonEndpoint(reminderReport, async (ctx, report) =>
    json(200, { result: await ctx.runMutation(internal.automation.recordReminder, report) }),
  ),
});

http.route({
  path: "/automation/failures",
  method: "POST",
  handler: signedJsonEndpoint(failureReport, async (ctx, report) =>
    json(200, { result: await ctx.runMutation(internal.automation.recordFailure, report) }),
  ),
});

export default http;
