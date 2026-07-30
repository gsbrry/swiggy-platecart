import type { Appearance } from "@clerk/types";

/** Shared Clerk UI theme — matches PlateCart tokens in globals.css. */
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#fc8019",
    colorText: "#282c3f",
    colorTextSecondary: "#686b78",
    colorBackground: "#ffffff",
    colorInputBackground: "#f8f8f8",
    borderRadius: "0.5rem",
    fontFamily: '"DM Sans", system-ui, sans-serif',
  },
  elements: {
    rootBox: "mx-auto w-full max-w-[420px]",
    card: "rounded-xl border border-[#e8e8eb] shadow-none",
    headerTitle: "text-[var(--sw-charcoal)]",
    headerSubtitle: "text-[var(--sw-muted)]",
    formButtonPrimary:
      "bg-[var(--sw-orange)] hover:bg-[var(--sw-orange)] hover:opacity-90 text-sm font-bold",
    footerActionLink: "text-[var(--sw-orange)] hover:text-[var(--sw-orange)]",
    identityPreviewEditButton: "text-[var(--sw-orange)]",
  },
};
