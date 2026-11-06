"use client";

import { useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "./button";
import { Dialog } from "./dialog";

type ConfirmButtonProps = Omit<ButtonProps, "onClick"> & {
  title: string;
  description: string;
  confirmLabel: string;
  /** Resolve to `false` to keep the dialog open (e.g. when the action failed). */
  onConfirm: () => Promise<unknown>;
  children: ReactNode;
};

export function ConfirmButton({
  title,
  description,
  confirmLabel,
  onConfirm,
  children,
  ...buttonProps
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    try {
      if ((await onConfirm()) !== false) setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title} description={description}>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Keep it
          </Button>
          <Button variant="danger" disabled={pending} onClick={confirm}>
            {confirmLabel}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
