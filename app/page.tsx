import { AuthCta } from "@/components/layout/auth-cta";
import { Brand } from "@/components/layout/brand";
import { NotificationStack } from "@/components/layout/notification-stack";
import { Pegboard } from "@/components/tools/pegboard";

const LOAN_STEPS = [
  { title: "Request", text: "Pick your dates. The owner gets a heads-up right away." },
  { title: "Pick up", text: "Once approved, you get a confirmation with the return date." },
  { title: "Return", text: "Late? You get a friendly nudge, so every tool finds its way home." },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Brand />
        <AuthCta size="sm" />
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pt-16">
          <div className="grid gap-6">
            <h1 className="font-display text-6xl leading-[0.92] font-extrabold tracking-wide text-balance sm:text-7xl xl:text-[5.5rem]">
              Borrow what you need. Lend what you don&apos;t.
            </h1>
            <p className="max-w-md text-lg text-muted">
              A lending board for your street. List the tools you rarely use, borrow the ones you
              need, and let LendLoop handle the reminders.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <AuthCta size="lg" />
            </div>
          </div>
          <Pegboard />
        </section>

        <section aria-labelledby="steps-heading" className="border-y-2 border-ink bg-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6">
            <h2 id="steps-heading" className="font-display text-3xl font-extrabold tracking-wide">
              How a loan works
            </h2>
            <ol className="grid gap-8 sm:grid-cols-3">
              {LOAN_STEPS.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[auto_1fr] items-start gap-4">
                  <span className="font-numeric text-6xl leading-none font-extrabold text-yellow [-webkit-text-stroke:2px_var(--ink)]">
                    {index + 1}
                  </span>
                  <div className="grid gap-1 pt-1">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="overflow-hidden bg-[#1b2733] text-[#e6eae4]">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div className="grid gap-5">
              <h2 className="font-display text-5xl leading-[0.95] font-extrabold tracking-wide sm:text-6xl">
                The reminders do the nagging.
              </h2>
              <p className="max-w-md text-lg text-[#e6eae4]/75">
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

      <footer className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted sm:px-6">
        LendLoop is a neighborhood project. Be kind, return things clean.
      </footer>
    </div>
  );
}
