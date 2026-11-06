const reminder = $("Compose reminders").item.json;
const error = $json.error;

return {
  json: {
    ...reminder,
    channel: "email",
    status: error ? "failed" : "sent",
    error: error ? String(error.message ?? error) : undefined,
  },
};
