import { AuthCta } from "@/components/layout/auth-cta";
import { Brand } from "@/components/layout/brand";
import { PublicToolList } from "@/components/tools/public-tool-list";

const STEPS = [
  ["List", "Share the tools gathering dust in your shed."],
  ["Request", "Pick dates for what you need. The lender approves."],
  ["Return", "Get reminders so nothing stays borrowed forever."],
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <Brand />
        <AuthCta size="sm" />
      </header>

      <section className="grid gap-6 pt-8 sm:pt-16">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Borrow what you need. Lend what you don&apos;t.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          LendLoop is a tool-lending board for your neighborhood, with automatic request
          notifications and friendly return reminders.
        </p>
        <div>
          <AuthCta />
        </div>
        <ol className="grid gap-4 pt-4 sm:grid-cols-3">
          {STEPS.map(([title, text], index) => (
            <li key={title} className="grid content-start gap-1">
              <span className="text-sm font-semibold text-accent">
                {index + 1}. {title}
              </span>
              <span className="text-sm text-muted">{text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 pb-16" aria-labelledby="available-heading">
        <h2 id="available-heading" className="text-lg font-semibold">
          Available right now
        </h2>
        <PublicToolList />
      </section>
    </div>
  );
}
