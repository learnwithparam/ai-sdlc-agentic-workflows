// bun parts/07-learn-from-the-incident/make-begin-history.ts <output-folder>
//
// For course authors. It builds the Kestrel repo as it stands when Part 7 begins, on the same
// ticket as Part 4. It starts from the end of Part 4 (the built wrench change, P-1 to P-5), lays
// the signed output of Parts 5 and 6 on top, and adds the North incident logs. Nothing here comes
// from world/finished/. The step's problem/history.bundle is made from this repo with
// git bundle create.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROOT } from "../../scripts/structure";

const PART_FOUR_END = join(
  ROOT,
  "parts/04-build-the-change/03-build-in-small-slices/solution/history.bundle",
);
const INCIDENT_LOGS = join(ROOT, "world", "incidents", "north-double-wrench");
// The solution folders of Parts 5 and 6, in lifecycle order. Each holds the files its step added.
const STEP_SOLUTIONS = [
  "parts/05-review-the-change/01-write-the-review-rules/solution",
  "parts/05-review-the-change/02-review-with-fresh-eyes/solution",
  "parts/06-release-the-change/01-write-the-release-notes/solution",
  "parts/06-release-the-change/02-gate-the-release/solution",
];
const NOT_PART_OF_THE_REPO = new Set(["history.bundle", "prompts.md", "README.md", "images", "recordings"]);
const CLAUDE_TRAILER = "Co-Authored-By: Claude <noreply@anthropic.com>";

function git(folder: string, words: string[]) {
  const result = Bun.spawnSync(["git", ...words], { cwd: folder });
  if (result.exitCode !== 0) throw new Error(`git ${words.join(" ")}: ${result.stderr}`);
}

function lay(solution: string, repo: string) {
  for (const entry of readdirSync(solution)) {
    if (NOT_PART_OF_THE_REPO.has(entry)) continue;
    cpSync(join(solution, entry), join(repo, entry), { recursive: true });
  }
}

const outputFolder = process.argv[2] ?? mkdtempSync(join(tmpdir(), "part-7-begin-"));
if (existsSync(outputFolder)) rmSync(outputFolder, { recursive: true, force: true });
mkdirSync(outputFolder, { recursive: true });
git(ROOT, ["clone", "--quiet", PART_FOUR_END, outputFolder]);
// Recorded runs are course files, not part of the learner repo.
rmSync(join(outputFolder, "recordings"), { recursive: true, force: true });
for (const solution of STEP_SOLUTIONS) lay(join(ROOT, solution), outputFolder);
git(outputFolder, ["add", "--all"]);
git(outputFolder, ["commit", "--quiet", "-m", `Review and release: rules, notes and rollout, signed\n\n${CLAUDE_TRAILER}`]);
cpSync(INCIDENT_LOGS, join(outputFolder, "data", "incidents", "north-double-wrench"), {
  recursive: true,
});
git(outputFolder, ["add", "--all"]);
git(outputFolder, ["commit", "--quiet", "-m", "Add the North incident logs"]);
console.log(`Built the Part 7 begin state in ${outputFolder}`);
