import { cn } from "@/lib/utils";

type LogoMarkProps = { className?: string; loop?: boolean; loopClassName?: string };

/** The LendLoop mark: a house of tools inside the borrow-and-return loop. The house takes `currentColor`. */
export function LogoMark({ className, loop = true, loopClassName }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-9 shrink-0", className)} aria-hidden>
      {loop && (
        <g fill="var(--yellow)" className={loopClassName}>
          <path
            d="M8.44 21.01A26 26 0 0 1 53.55 17.46M55.56 42.99A26 26 0 0 1 10.45 46.54"
            fill="none"
            stroke="var(--yellow)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path d="M48.17 21.1 57.23 25.71 58.94 13.83zM15.83 42.9 6.77 38.29 5.06 50.17z" />
        </g>
      )}
      <path
        fill="var(--yellow)"
        d="M29.6 21.2h2v2h-2zm2.8 0h2v2h-2zm-2.8 2.8h2v2h-2zm2.8 0h2v2h-2z"
      />
      <g fill="currentColor">
        <path
          d="M14 30 32 16l18 14M19.5 29v8M44.5 29v8"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M18 38h28v3a9 9 0 0 1-9 9H27a9 9 0 0 1-9-9z" />
        <g transform="translate(25 30.4) rotate(-14)">
          <rect x="-3.6" y="-1.6" width="7.2" height="2.6" rx=".6" />
          <rect x="-.9" y=".4" width="1.8" height="7.4" rx=".9" />
        </g>
        <g transform="translate(29.4 29.6)">
          <rect width="6" height="3.4" rx="1.2" />
          <rect x="5.6" y=".9" width="1.6" height="1.6" />
          <path d="M7 1.4h2v.6H7zM1.3 3h2.6l-.5 5.2H1.2z" />
        </g>
        <g transform="translate(40.2 34.2) rotate(35)">
          <rect x="-.85" y="-1.2" width="1.7" height="5.6" rx=".85" />
          <path d="M-2.3-2.8a2.3 2.3 0 0 0 4.6 0v-2.1H.8v1.6H-.8v-1.6h-1.5z" />
        </g>
      </g>
    </svg>
  );
}
