// The audit needs the course app running. Set AUDIT_URL to where it listens.
// Set AUDIT_SERVER to a command that starts it, and Playwright starts and stops it for you.
import { defineConfig } from "@playwright/test";

const appUrl = process.env.AUDIT_URL ?? "http://localhost:4100";
// This course starts the Kestrel spoke itself, on port 4100.
const startCommand = process.env.AUDIT_SERVER ?? "bun world/kestrel/src/server.ts";

export default defineConfig({
  testDir: ".",
  testMatch: "text-audit.spec.ts",
  reporter: "list",
  // biome-ignore lint/style/useNamingConvention: baseURL is the name Playwright requires
  use: { baseURL: appUrl, trace: "off" },
  webServer: startCommand
    ? { command: startCommand, url: appUrl, reuseExistingServer: true, cwd: "..", stdout: "ignore" }
    : undefined,
});
