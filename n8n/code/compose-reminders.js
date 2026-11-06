const { loans } = $input.first().json;

return loans.map((loan) => ({
  json: {
    loanId: loan.loanId,
    reminderKey: loan.reminderKey,
    to: loan.borrower.email,
    name: loan.borrower.name,
    subject: `Reminder: please return the ${loan.toolName}`,
    text: `Hi ${loan.borrower.name}, the ${loan.toolName} was due back on ${loan.endDate} (${loan.daysOverdue} day(s) ago). Please return it to its owner as soon as possible.`,
  },
}));
