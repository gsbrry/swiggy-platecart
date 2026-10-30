import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Appetite palette — values live in globals.css so a rebrand is one file.
      colors: {
        ink: { DEFAULT: "var(--ink)", muted: "var(--ink-muted)", faint: "var(--ink-faint)", orange: "var(--ink-orange)" },
        brand: { orange: "var(--brand-orange)", red: "var(--brand-red)" },
        action: "var(--action-solid)",
        "tint-orange": "var(--tint-orange)",
        "fill-subtle": "var(--fill-subtle)",
        hairline: "var(--hairline)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      maxWidth: { app: "1200px" },
    },
  },
  plugins: [],
};

export default config;
