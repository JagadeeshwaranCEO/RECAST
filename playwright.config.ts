import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3101",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next dev -p 3101",
    url: "http://localhost:3101",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
