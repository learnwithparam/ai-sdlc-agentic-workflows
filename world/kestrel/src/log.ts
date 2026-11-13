// Every event spoke handles goes to logs/spoke.log, one JSON object per line.
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const LOG_FILE = process.env.SPOKE_LOG ?? join(import.meta.dir, "..", "logs", "spoke.log");

export function logEvent(event: string, details: Record<string, unknown>) {
  mkdirSync(dirname(LOG_FILE), { recursive: true });
  const line = { at: new Date().toISOString(), event, ...details };
  appendFileSync(LOG_FILE, `${JSON.stringify(line)}\n`);
}
