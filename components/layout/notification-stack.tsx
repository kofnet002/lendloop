const NOTIFICATIONS = [
  {
    title: "New request to borrow your cordless drill",
    body: "A neighbor would like it from Nov 8 to Nov 10.",
    time: "now",
  },
  {
    title: "Approved: hedge trimmer",
    body: "Pick it up whenever suits Ada. Please return it by Nov 12.",
    time: "2h ago",
  },
  {
    title: "Reminder: please return the extension ladder",
    body: "It was due back yesterday. Ben is counting on it.",
    time: "8:00",
  },
] as const;

/** Static preview of the notes LendLoop's automations send, styled like a phone lock screen. */
export function NotificationStack() {
  return (
    <ul className="relative grid gap-3" aria-label="Example notifications">
      {NOTIFICATIONS.map((note, index) => (
        <li
          key={note.title}
          style={{ marginLeft: `${index * 1.25}rem`, rotate: `${[-1.5, 1, -0.5][index]}deg` }}
          className="flex gap-3 rounded-2xl bg-[#e6eae4]/95 p-4 text-[#1b2733] shadow-[0_10px_30px_rgb(0_0_0/0.35)] backdrop-blur"
        >
          <svg viewBox="0 0 32 32" className="size-9 shrink-0" aria-hidden>
            <rect width="32" height="32" rx="8" fill="#f7c520" />
            <circle cx="13" cy="16" r="6" fill="none" stroke="#1b2733" strokeWidth="3" />
            <circle cx="19" cy="16" r="6" fill="none" stroke="#1b2733" strokeWidth="3" />
          </svg>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <p className="flex justify-between gap-3 text-xs text-[#5e6a72]">
              <span className="font-semibold">LendLoop</span>
              <span>{note.time}</span>
            </p>
            <p className="text-sm font-semibold">{note.title}</p>
            <p className="text-sm text-[#5e6a72]">{note.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
