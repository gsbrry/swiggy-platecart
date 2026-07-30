import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Swiggy palette pulled from /docs/screens mockups
        primary: {
          DEFAULT: "#FC8019",
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
