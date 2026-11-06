return $input.all().map(({ json }) =>
  ({
    json: signed({
      reminderKey: json.reminderKey,
      loanId: json.loanId,
      status: json.status ?? "sent",
      channel: json.channel,
      ...(json.error ? { error: json.error } : {}),
    }),
  }),
);
