import { defineConfig, devices } from "@playwright/test";

/**
 * UI tests run the real Next.js app against a local Supabase stand-in (e2e/mock-supabase.cjs),
 * so they need no network or secrets. The live database is covered by supabase/tests/*.sql.
 */
const APP_PORT = 3300;
const MOCK_PORT = 54329;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${APP_PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "node e2e/mock-supabase.cjs",
      port: MOCK_PORT,
      env: { MOCK_SUPABASE_PORT: String(MOCK_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx next dev -p ${APP_PORT}`,
      port: APP_PORT,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${MOCK_PORT}`,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_e2e_mock_key",
      },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
