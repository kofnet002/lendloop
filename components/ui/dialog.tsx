"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
};

export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-labelledby="dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-2 border-ink bg-surface p-0 text-ink shadow-xl"
    >
      {open && (
        <div className="grid gap-4 p-5">
          <header className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <h2 id="dialog-title" className="font-display text-2xl font-extrabold tracking-wide">
                {title}
              </h2>
              {description && <p className="text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-muted hover:bg-paper"
            >
              <X className="size-4" />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
