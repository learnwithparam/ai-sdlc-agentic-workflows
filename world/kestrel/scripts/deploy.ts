// bun run deploy:production and bun run rollback. In the course world these only write a log line,
// but the team treats them like the real thing: a person approves the release first.
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const action = process.argv[2] ?? "production";
const logFolder = join(import.meta.dir, "..", "logs");
mkdirSync(logFolder, { recursive: true });
appendFileSync(join(logFolder, "deploys.log"), `${new Date().toISOString()} ${action}\n`);

if (action === "rollback") console.log("Rolled spoke back to the last good release.");
else console.log("Deployed spoke to production.");
