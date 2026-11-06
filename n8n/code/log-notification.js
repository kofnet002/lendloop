return $input.all().map(({ json }) => {
  console.log(`[lendloop] notify ${json.name} <${json.to ?? "no-email"}>: ${json.subject}`);
  return { json: { ...json, channel: "log" } };
});
