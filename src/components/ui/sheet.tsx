"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/**
 * Bottom sheet on phones, centred dialog on larger screens. Uses <dialog> for focus
 * trapping, Esc-to-close and an accessible modal role for free.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className={`glass-overlay m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-2xl p-0 text-ink backdrop:bg-[rgb(43_29_26/0.32)] backdrop:backdrop-blur-[4px] sm:m-auto sm:rounded-2xl ${
        wide ? "sm:max-w-2xl" : "sm:max-w-lg"
      }`}
    >
      <div className="flex max-h-[88dvh] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-fill-subtle" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">{open && children}</div>
      </div>
    </dialog>
  );
}
