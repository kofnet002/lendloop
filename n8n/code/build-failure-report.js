const { execution = {}, trigger = {}, workflow = {} } = $input.first().json;

const report = {
  workflow: workflow.name ?? "unknown",
  executionId: String(execution.id ?? `trigger-${workflow.id ?? "unknown"}-${Date.now()}`),
  node: execution.lastNodeExecuted ?? trigger.error?.node?.name,
  message: execution.error?.message ?? trigger.error?.message ?? "Unknown error",
};
console.error(`[lendloop] workflow failed: ${JSON.stringify(report)}`);

return [{ json: signed(report) }];
