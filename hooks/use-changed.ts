"use client";

import { useEffect, useRef, useState } from "react";

/** True once `value` differs from what it was on first render: animates real updates, not initial loads. */
export function useChanged<T>(value: T): boolean {
  const initial = useRef(value);
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (value !== initial.current) setChanged(true);
  }, [value]);
  return changed;
}
