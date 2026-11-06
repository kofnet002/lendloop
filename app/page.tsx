import { AuthCta } from "@/components/layout/auth-cta";
import { Brand } from "@/components/layout/brand";
import { LoanLoop } from "@/components/layout/loan-loop";
import { NotificationStack } from "@/components/layout/notification-stack";
import { CategoryMarquee } from "@/components/tools/category-marquee";
import { LiveCount } from "@/components/tools/live-count";
import { Pegboard } from "@/components/tools/pegboard";
import { cssVars } from "@/lib/utils";

const SECTIONS = [
  { href: "#pegs", label: "On the pegs" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#reminders", label: "Reminders" },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          <Brand />
          <div className="flex items-center gap-1 sm:gap-2">
            {SECTIONS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-ink/5 hover:text-ink md:block"
              >
                {label}
              </a>
            ))}
            <span className="ml-2">
              <AuthCta size="sm" />
            </span>
          </div>
        </nav>
      </header>

      <main>
        <section
          id="pegs"
          className="mx-auto grid max-w-6xl scroll-mt-20 items-center gap-10 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pt-12"
        >
          <div className="grid gap-6">
            <div className="rise">
              <LiveCount />
            </div>
            <h1
              style={cssVars({ "--delay": "80ms" })}
              className="rise font-display text-5xl leading-[1.02] font-bold tracking-tight text-balance sm:text-6xl"
            >
              Borrow what you need. Lend what you don&apos;t.
            </h1>
            <p style={cssVars({ "--delay": "160ms" })} className="rise max-w-md text-lg text-muted">
              Your neighborhood tool-lending board. List the tools you rarely use, borrow the ones
              you need, and let LendLoop handle the reminders.
            </p>
            <div
              style={cssVars({ "--delay": "240ms" })}
              className="rise flex flex-wrap items-center gap-5"
            >
              <AuthCta size="lg" />
              <a
                href="#how-it-works"
                className="text-sm font-semibold underline underline-offset-4"
              >
                How a loan works
              </a>
            </div>
          </div>
          <Pegboard />
        </section>

        <CategoryMarquee />

        <section
          id="how-it-works"
          aria-labelledby="loop-heading"
          className="mx-auto grid max-w-6xl scroll-mt-16 gap-10 px-4 py-20 sm:px-6"
        >
          <div className="grid max-w-xl gap-3">
            <h2
              id="loop-heading"
              className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
            >
              Borrow. Use. Return.
            </h2>
            <p className="text-lg text-muted">
              Every loan goes around the same loop, and LendLoop keeps it turning.
            </p>
          </div>
          <LoanLoop />
        </section>

        <section id="reminders" className="neon-backdrop scroll-mt-16 overflow-hidden text-chalk">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div className="grid gap-5">
              <h2 className="font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl">
                The reminders do the nagging.
              </h2>
              <p className="max-w-md text-lg text-chalk/75">
                Every request, approval and late return sends a short, friendly note to the right
                neighbor, so nobody has to chase anyone for their ladder.
              </p>
              <div>
                <AuthCta size="lg" />
              </div>
            </div>
            <NotificationStack />
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
        <Brand className="text-xl" />
        <p>Your neighborhood tool-lending board. Be kind, return things clean.</p>
      </footer>
    </div>
  );
}
