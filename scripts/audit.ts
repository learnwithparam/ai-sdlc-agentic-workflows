// bun run audit: the text audit on the Kestrel map page, at 1280 px and 375 px wide.
// It starts the spoke on its own port, runs the checks in e2e/, and stops the spoke again.
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const PORT = process.env.AUDIT_PORT ?? "4190";
const server = join(ROOT, "world", "kestrel", "src", "server.ts");
const scratchDatabase = join(process.env.TMPDIR ?? "/tmp", `audit-spoke-${process.pid}.db`);

// CI runs this check without a separate install step, so fetch what the audit needs first.
function step(command: string[]) {
  const done = Bun.spawnSync(command, { cwd: ROOT, stdout: "inherit", stderr: "inherit" });
  if (done.exitCode !== 0) process.exit(done.exitCode ?? 1);
}
if (!existsSync(join(ROOT, "node_modules", "@playwright", "test"))) {
  step(["bun", "install", "--frozen-lockfile"]);
}
step(["bunx", "playwright", "install", "chromium"]);

const run = Bun.spawnSync(
  ["bunx", "playwright", "test", "-c", join(ROOT, "e2e", "playwright.config.ts"), "--trace", "off"],
  {
    cwd: ROOT,
    stdout: "inherit",
    stderr: "inherit",
    env: {
      ...process.env,
      AUDIT_URL: `http://localhost:${PORT}`,
      AUDIT_SERVER: `bun ${server}`,
      PORT,
      SPOKE_DB: scratchDatabase,
      SPOKE_LOG: `${scratchDatabase}.log`,
    },
  },
);
process.exit(run.exitCode ?? 1);
