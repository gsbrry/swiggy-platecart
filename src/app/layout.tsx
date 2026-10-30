import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { headers } from "next/headers";

import { APP_NAME } from "@/components/brand/logo";
import { env } from "@/lib/env";

import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${APP_NAME} — plan your week of meals`, template: `%s · ${APP_NAME}` },
  description:
    "Plan breakfast, lunch and dinner for the week, share your plan on WhatsApp, and copy ready-made menus from other home cooks.",
  applicationName: APP_NAME,
};

export const viewport: Viewport = {
  themeColor: "#fff6ef",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  // Reading the nonce opts every page into dynamic rendering, so Next can stamp the CSP nonce on its scripts.
  await headers();
  return (
    <html lang="en-IN" className={dmSans.className}>
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
