// The rule "no criterion keeps a wrenched bike in the feed for 15 minutes" must be able to fail.
// The spec here is the recorded solution spec with one criterion added by this test, so the only
// thing that changes is the grace period. This is a test input, not a course sample.
import { expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import rules from "../checks/write-the-spec";
import { kestrelFolderFor } from "../checks/lib/snapshot";
import { ROOT } from "../scripts/structure";

const GRACE_RULE = "no criterion keeps a wrenched bike in the feed for 15 minutes";
const solution = join(ROOT, "parts/03-design-the-change/02-write-the-spec/solution");
const graceCriterion = [
  "**AC-99: Wrenched bike stays in the feed for a while**",
  "WHEN a bike has been wrenched",
  "THEN the feed keeps it with `is_disabled: false` for 15 minutes, then shows `is_disabled: true`.",
  "",
  "",
].join("\n");

function foldersWithGracePeriod(): string {
  const folder = mkdtempSync(join(tmpdir(), "grace-"));
  cpSync(kestrelFolderFor(solution), folder, { recursive: true });
  const specPath = join(folder, "work/spec.md");
  const spec = readFileSync(specPath, "utf8");
  writeFileSync(specPath, spec.replace("## Concerns", `${graceCriterion}## Concerns`));
  return folder;
}

async function failedRules(folder: string): Promise<string[]> {
  const failed: string[] = [];
  for (const rule of rules) {
    if (!(await rule.test(folder))) failed.push(rule.says);
  }
  return failed;
}

test("the grace period rule is in the check", () => {
  expect(rules.map((rule) => rule.says)).toContain(GRACE_RULE);
});

test("the solution spec passes the grace period rule", async () => {
  expect(await failedRules(kestrelFolderFor(solution))).not.toContain(GRACE_RULE);
});

test("a criterion that keeps the bike in the feed for 15 minutes fails that rule", async () => {
  const folder = foldersWithGracePeriod();
  const failed = await failedRules(folder);
  rmSync(folder, { recursive: true, force: true });
  expect(failed).toContain(GRACE_RULE);
});

test("only the grace period rule and the signature rule fail on that spec", async () => {
  const folder = foldersWithGracePeriod();
  const failed = await failedRules(folder);
  rmSync(folder, { recursive: true, force: true });
  const signature = "the pm approved spec.md as it is now, after the intent";
  expect(failed.filter((says) => says !== signature)).toEqual([GRACE_RULE]);
});
