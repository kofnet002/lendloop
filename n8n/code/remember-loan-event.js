const MAX_REMEMBERED = 1000;

const message = $("Compose message").first().json;
const channel = $input.first().json.channel ?? "email";
const staticData = $getWorkflowStaticData("global");
const delivered = staticData.deliveredEventIds ?? [];
staticData.deliveredEventIds = [...delivered, message.eventId].slice(-MAX_REMEMBERED);

return [{ json: { status: "delivered", eventId: message.eventId, channel } }];
