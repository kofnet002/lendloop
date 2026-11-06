"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "./logo-mark";

const NOTIFICATIONS = [
  {
    title: "New request to borrow your cordless drill",
    body: "A neighbor would like it from Nov 8 to Nov 10.",
  },
  {
    title: "Approved: hedge trimmer",
    body: "Pick it up whenever suits Ada. Please return it by Nov 12.",
  },
  {
    title: "Reminder: please return the extension ladder",
    body: "It was due back yesterday. Ben is counting on it.",
  },
  {
    title: "Your stand mixer is home",
    body: "Cy marked it returned. Thanks for lending!",
  },
  {
    title: "New request to borrow your two-person tent",
    body: "Lena would like it for the weekend.",
  },
] as const;

const VISIBLE = 3;
const INTERVAL_MS = 3200;
const TIMES = ["now", "2m ago", "1h ago"];

/** A looping preview of the notes LendLoop's automations send, styled like a phone lock screen. */
export function NotificationStack() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTick((value) => value + 1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const shown = Array.from({ length: VISIBLE }, (_, index) => {
    const position = tick - index;
    const note =
      NOTIFICATIONS[
        ((position % NOTIFICATIONS.length) + NOTIFICATIONS.length) % NOTIFICATIONS.length
      ];
    return { ...note, key: position, time: TIMES[index] };
  });

  return (
    <ul className="relative grid gap-3" aria-label="Example notifications">
      {shown.map((note, index) => (
        <li
          key={note.key}
          style={{ marginLeft: `${index * 1.25}rem`, opacity: 1 - index * 0.18 }}
          className="note-in flex gap-3 rounded-2xl bg-chalk/95 p-4 text-navy shadow-[0_10px_30px_rgb(0_0_0/0.35)] backdrop-blur transition-[margin,opacity] duration-500"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-chalk">
            <LogoMark className="size-8" />
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <p className="flex justify-between gap-3 text-xs text-navy/60">
              <span className="font-semibold">LendLoop</span>
              <span>{note.time}</span>
            </p>
            <p className="text-sm font-semibold">{note.title}</p>
            <p className="text-sm text-navy/65">{note.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
