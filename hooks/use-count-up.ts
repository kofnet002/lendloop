import { useEffect, useRef, useState } from "react";

const DURATION_MS = 700;

/** Eases a displayed number toward `target`, so live counts tick rather than jump. */
export function useCountUp(target: number) {
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : DURATION_MS;
    const began = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const progress = duration ? Math.min((now - began) / duration, 1) : 1;
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(start + (target - start) * eased);
      from.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}
