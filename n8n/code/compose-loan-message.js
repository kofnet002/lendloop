const TEMPLATES = {
  "loan.requested": ({ loan }) => ({
    subject: `New request to borrow your ${loan.toolName}`,
    text: `A neighbor would like to borrow your ${loan.toolName} from ${loan.startDate} to ${loan.endDate}. Review it under Incoming requests.`,
  }),
  "loan.approved": ({ loan }) => ({
    subject: `Approved: ${loan.toolName}`,
    text: `Your request for the ${loan.toolName} (${loan.startDate} – ${loan.endDate}) was approved. Please return it by ${loan.endDate}.`,
  }),
  "loan.declined": ({ loan }) => ({
    subject: `Declined: ${loan.toolName}`,
    text: `Your request for the ${loan.toolName} (${loan.startDate} – ${loan.endDate}) was declined. Try other dates or another tool.`,
  }),
  "loan.cancelled": ({ loan }) => ({
    subject: `Request cancelled: ${loan.toolName}`,
    text: `A borrower cancelled their request for your ${loan.toolName} (${loan.startDate} – ${loan.endDate}).`,
  }),
  "loan.returned": ({ loan }) => ({
    subject: `Returned: ${loan.toolName}`,
    text: `The lender confirmed the ${loan.toolName} was returned. Thanks for borrowing responsibly!`,
  }),
};

const { event } = $input.first().json;
const template = TEMPLATES[event.type];
if (!template) throw new Error(`Unsupported event type: ${event.type}`);

return [
  {
    json: {
      eventId: event.id,
      type: event.type,
      to: event.recipient.email,
      name: event.recipient.name,
      ...template(event),
    },
  },
];
