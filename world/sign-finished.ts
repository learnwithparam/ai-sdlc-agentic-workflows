// bun world/sign-finished.ts: writes the approvals of the finished chain.
//
// In the course, each approval comes from bun run approve, typed by a person. The finished chain
// is our sample end state, so this script signs it the same way: one line per gate, in order,
// with the hash of the file as it is in world/finished/. Run it after any change to those files.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CHAIN } from "../checks/lib/chain";
import { contentHash } from "../checks/lib/files";
import { buildSnapshot } from "../checks/lib/snapshot";

const FINISHED_FOLDER = join(import.meta.dir, "finished");
const FIRST_SIGNATURE = Date.parse("2026-11-02T09:00:00Z");
const SIGNED_BY: Record<string, string> = {
  pm: "Theo Lindqvist",
  "tech-lead": "Ines Moreau",
  qa: "Raj Patel",
  "release-manager": "Mei Tanaka",
  em: "Dana Okafor",
};

if (import.meta.main) {
  const folder = buildSnapshot(FINISHED_FOLDER);
  const lines = CHAIN.map((gate, index) => {
    const signedAt = new Date(FIRST_SIGNATURE + index * 45 * 60 * 1000).toISOString();
    const sha256 = contentHash(folder, gate.file);
    return JSON.stringify({
      file: gate.file,
      sha256,
      role: gate.role,
      at: signedAt,
      by: SIGNED_BY[gate.role],
    });
  });
  mkdirSync(join(FINISHED_FOLDER, "work"), { recursive: true });
  writeFileSync(join(FINISHED_FOLDER, "work", "approvals.jsonl"), `${lines.join("\n")}\n`);
  console.log(`Signed ${lines.length} gates in world/finished/work/approvals.jsonl`);
}
