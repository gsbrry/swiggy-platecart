"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
};

/** Reusable confirmation modal — pattern mirrors ForkModal in template detail. */
export function ConfirmModal({ title, description, confirmLabel, onClose, onConfirm }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusables = [closeBtnRef.current, cancelBtnRef.current, confirmBtnRef.current].filter(
          Boolean,
        ) as HTMLButtonElement[];
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-[199] bg-black/30" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="fixed left-1/2 top-1/2 z-[200] w-[92%] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--sw-border)] bg-white p-7 text-center shadow-2xl"
      >
        <button
          ref={closeBtnRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 text-[var(--sw-muted)] hover:text-[var(--sw-charcoal)]"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[rgba(220,38,38,0.1)]">
          <AlertTriangle className="h-6 w-6 text-[#DC2626]" />
        </div>
        <h2 id="confirm-title" className="mb-1 text-[17px] font-bold text-[var(--sw-charcoal)]">
          {title}
        </h2>
        <p id="confirm-desc" className="mb-[18px] text-[12.5px] leading-relaxed text-[var(--sw-muted)]">
          {description}
        </p>
        <div className="flex gap-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-page)]"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-[#DC2626] px-4 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
