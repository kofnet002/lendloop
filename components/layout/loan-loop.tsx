import { Drill, Hammer, Hand, House, type LucideIcon } from "lucide-react";
import { cssVars } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

const PERIOD_S = 9;

const STAGES: { title: string; text: string; icon: LucideIcon; angle: number }[] = [
  {
    title: "Borrow",
    text: "Pick your dates on the board. The owner gets a heads-up right away.",
    icon: Hand,
    angle: -90,
  },
  {
    title: "Use",
    text: "Once approved, collect it and get the job done. Your return date is on the loan.",
    icon: Hammer,
    angle: 30,
  },
  {
    title: "Return",
    text: "Bring it back clean. Running late? A friendly nudge arrives, so every tool finds its way home.",
    icon: House,
    angle: 150,
  },
];

const RING =
  "M66.27 13.46A40 40 0 0 1 90 50M73.51 82.36A40 40 0 0 1 30 84.64M10.22 54.18A40 40 0 0 1 30 15.36";
const HEADS = "M86 50l3.39 6.95L94 50zM32 81.18l-7.71-.54 3.71 7.47zM32 18.82l4.32-6.41-8.32-.52z";

function stageStyle(index: number) {
  return cssVars({ "--delay": `${(index * PERIOD_S) / STAGES.length}s` });
}

/** Borrow → use → return, drawn as the loop from the logo with a tag travelling around it. */
export function LoanLoop() {
  return (
    <div
      style={cssVars({ "--period": `${PERIOD_S}s` })}
      className="grid items-center gap-10 lg:grid-cols-[minmax(0,26rem)_1fr]"
    >
      <div className="relative mx-auto aspect-square w-full max-w-[22rem]" aria-hidden>
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
          <path
            d={RING}
            fill="none"
            stroke="var(--yellow)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path d={HEADS} fill="var(--yellow)" />
        </svg>

        <div className="orbit absolute inset-0">
          <span className="absolute top-[10%] left-1/2 grid size-9 -translate-1/2 place-items-center rounded-full border-2 border-navy bg-yellow text-navy shadow-md">
            <Drill className="size-4" />
          </span>
        </div>

        {STAGES.map(({ title, icon: Icon, angle }, index) => (
          <span
            key={title}
            style={{
              ...stageStyle(index),
              left: `${50 + 40 * Math.cos((angle * Math.PI) / 180)}%`,
              top: `${50 + 40 * Math.sin((angle * Math.PI) / 180)}%`,
            }}
            className="stage absolute grid size-20 -translate-1/2 place-items-center content-center gap-0.5 rounded-full border-2 border-ink bg-surface text-xs font-semibold shadow-[0_3px_0_var(--ink)]"
          >
            <Icon className="size-6" />
            {title}
          </span>
        ))}

        <LogoMark
          loop={false}
          className="absolute top-1/2 left-1/2 size-32 -translate-1/2 text-ink"
        />
      </div>

      <ol className="grid gap-3">
        {STAGES.map(({ title, text }, index) => (
          <li
            key={title}
            style={stageStyle(index)}
            className="stage grid origin-left gap-1 rounded-2xl border-2 border-ink bg-surface px-5 py-4"
          >
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm opacity-80">{text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
