import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Appetite palette — keep in sync with globals.css tokens
        primary: {
          DEFAULT: "#F26419",
          foreground: "#FFFFFF",
        },
        charcoal: "#282C3F",
        "gray-50": "#F5F5F5",
      },
    },
  },
  plugins: [],
};

export default config;
