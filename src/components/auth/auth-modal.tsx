"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Sign-in / sign-up as a popup over the page the visitor is on. The page behind is blurred.
 * Closing goes back in history, which returns to that page without reloading it.
 */
export function AuthModal({ label, children }: { label: string; children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) {
      el.showModal();
      el.querySelector<HTMLElement>("input[type=email], input:not([type=hidden])")?.focus();
    }
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        router.back();
      }}
      onClick={(e) => {
        if (e.target === ref.current) router.back();
      }}
      className="glass-overlay fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-b-none rounded-t-2xl p-0 text-ink backdrop:bg-[rgb(43_29_26/0.35)] backdrop:backdrop-blur-md sm:inset-0 sm:m-auto sm:max-h-[90dvh] sm:w-[440px] sm:rounded-2xl"
    >
      <div className="relative p-6 pb-[calc(24px+env(safe-area-inset-bottom))] sm:p-8">
        <button
          type="button"
          aria-label="Close"
          onClick={() => router.back()}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-fill-subtle"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </dialog>
  );
}
