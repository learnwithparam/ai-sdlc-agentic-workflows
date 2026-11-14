// write-the-failing-tests: one acceptance test per criterion, committed before any code, and red
// where the code is wrong today. The qa role signed the tests, so they cannot change quietly.

import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { approvalHolds, approvedInOrder } from "./lib/approvals";
import { fileExists, readFile, readJson } from "./lib/files";
import { type Commit, commitsOf, git, hasHistory } from "./lib/git";
import type { Rule } from "./lib/rule";

const TESTS = "test/acceptance";
const SPEC = "work/spec.md";
const PLAN = "work/plan.md";

// Criteria about the three faults planted in today's code: the feed, the clock and the order.
// Their tests must be red before the fix. Guard criteria, such as "unknown bikes give 404",
// may already pass.
const PLANTED_FAULTS = [
  /is_disabled: true/,
  /deadline[^\n]*reported_at/,
  /(sorted|ordered) by `?deadline/,
];

function criterionIds(folder: string): string[] {
  const found = readFile(folder, SPEC).match(/\bAC-\d+\b/g) ?? [];
  return [...new Set(found)];
}

function testFiles(folder: string): string[] {
  if (!fileExists(folder, TESTS)) return [];
  const names = readdirSync(join(folder, TESTS));
  return names.filter((name) => name.endsWith(".test.ts"));
}

// "AC-3" matches ac-3-station-available-drops.test.ts or AC-3.test.ts, never ac-30.
function testFileFor(folder: string, id: string): string | undefined {
  const number = id.slice(3);
  const pattern = new RegExp(`^ac-${number}(\\D|$)`, "i");
  return testFiles(folder).find((name) => pattern.test(name));
}

// The criterion's own lines in the spec: from its id to the next blank-line-and-bold or heading.
function criterionText(folder: string, id: string): string {
  const spec = readFile(folder, SPEC);
  const start = spec.search(new RegExp(`\\*\\*${id}\\b`));
  if (start < 0) return "";
  const rest = spec.slice(start + id.length + 2);
  const end = rest.search(/\*\*AC-\d+|^#{1,6} /m);
  return end < 0 ? rest : rest.slice(0, end);
}

function criteriaForPlantedFaults(folder: string): string[] {
  const touchesFault = (id: string) =>
    PLANTED_FAULTS.some((pattern) => pattern.test(criterionText(folder, id)));
  return criterionIds(folder).filter(touchesFault);
}

// Ignore the first commit: it is the whole repo at the start of the step.
function laterCommits(folder: string): Commit[] {
  return commitsOf(folder).slice(1);
}

const touches = (commit: Commit, path: string) =>
  commit.files.some((file) => file.startsWith(path));

function testCommit(folder: string): Commit | undefined {
  return laterCommits(folder).find((commit) => touches(commit, TESTS));
}

function testsCameFirst(folder: string): boolean {
  const commits = laterCommits(folder);
  const firstTest = commits.findIndex((commit) => touches(commit, TESTS));
  const firstCode = commits.findIndex((commit) => touches(commit, "src/"));
  return firstTest >= 0 && (firstCode < 0 || firstTest < firstCode);
}

// A copy of the repo with today's tests but the code as it was when the tests were committed.
function beginStateCopy(folder: string): string | undefined {
  const commit = testCommit(folder);
  if (!commit) return undefined;
  const copy = mkdtempSync(join(tmpdir(), "kestrel-before-"));
  cpSync(folder, copy, { recursive: true });
  git(copy, ["checkout", commit.hash, "--", "src"]);
  return copy;
}

function testFails(folder: string, file: string): boolean {
  const run = Bun.spawnSync(["bun", "test", join(TESTS, file)], { cwd: folder, env: process.env });
  return run.exitCode !== 0;
}

function faultTestsAreRed(folder: string): boolean {
  const copy = hasHistory(folder) ? beginStateCopy(folder) : undefined;
  const faultCriteria = criteriaForPlantedFaults(folder);
  if (!copy) return false;
  const red = faultCriteria.filter((id) => {
    const file = testFileFor(folder, id);
    return file !== undefined && testFails(copy, file);
  });
  rmSync(copy, { recursive: true, force: true });
  return faultCriteria.length > 0 && red.length === faultCriteria.length;
}

// The hooks the learner registered in .claude/settings.json, as the command line Claude Code runs.
type HookEntry = { matcher?: string; hooks?: { command?: string }[] };

function hookCommand(folder: string, event: string, matcher?: string): string | undefined {
  const settings = readJson(folder, ".claude/settings.json") as
    | { hooks?: Record<string, HookEntry[]> }
    | undefined;
  const entries = settings?.hooks?.[event] ?? [];
  const wanted = entries.filter((entry) => !matcher || (entry.matcher ?? "").includes(matcher));
  return wanted.flatMap((entry) => entry.hooks ?? []).find((hook) => hook.command)?.command;
}

// Runs a registered hook the way Claude Code does: a shell command, the call as JSON on stdin.
function runHook(command: string, cwd: string, payload: object): number {
  const run = Bun.spawnSync(["sh", "-c", command], {
    cwd,
    stdin: Buffer.from(JSON.stringify(payload)),
    stdout: "pipe",
    stderr: "pipe",
  });
  return run.exitCode ?? 1;
}

function editHookExit(folder: string, file: string): number | undefined {
  const command = hookCommand(folder, "PreToolUse", "Edit");
  if (!command) return undefined;
  return runHook(command, folder, { tool_name: "Edit", tool_input: { file_path: file } });
}

// A tiny repo with one test, so the Stop hook is tried on a known red and a known green.
function stopHookExit(folder: string, testPasses: boolean): number | undefined {
  const command = hookCommand(folder, "Stop");
  if (!command) return undefined;
  const sandbox = mkdtempSync(join(tmpdir(), "kestrel-stop-"));
  cpSync(join(folder, ".claude"), join(sandbox, ".claude"), { recursive: true });
  mkdirSync(join(sandbox, "test"));
  const body = `import { expect, test } from "bun:test";\ntest("t", () => expect(1).toBe(${testPasses ? 1 : 2}));\n`;
  writeFileSync(join(sandbox, "test", "t.test.ts"), body);
  const exit = runHook(command, sandbox, { hook_event_name: "Stop", stop_hook_active: false });
  rmSync(sandbox, { recursive: true, force: true });
  return exit;
}

export default [
  {
    says: "test/acceptance has one test file per AC id in spec.md, named for its id",
    test: (folder) => {
      const ids = criterionIds(folder);
      return ids.length > 0 && ids.every((id) => testFileFor(folder, id) !== undefined);
    },
    tryNext: "ask Claude Code for one file per AC id, such as ac-1-wrench-disables-bike.test.ts",
  },
  {
    says: "the tests were committed before any change to src/",
    test: (folder) => hasHistory(folder) && testsCameFirst(folder),
    tryNext: "ask Claude Code to commit test/acceptance on its own, before it touches src/",
  },
  {
    says: "the test commit changes nothing in src/ and names P-1",
    test: (folder) => {
      const commit = testCommit(folder);
      return commit !== undefined && !touches(commit, "src/") && /\bP-1\b/.test(commit.subject);
    },
    tryNext: 'ask Claude Code to commit only test/acceptance/, with a message that starts "P-1:"',
  },
  {
    says: "on the code as it was, the tests for the feed, the clock and the queue order fail",
    test: faultTestsAreRed,
    tryNext: "a test that passes on broken code checks nothing; ask Claude Code why it is green",
  },
  {
    says: "the qa role approved test/acceptance as it is now, after the plan",
    test: (folder) => approvalHolds(folder, TESTS, "qa") && approvedInOrder(folder, PLAN, TESTS),
    tryNext: "read the tests, then run bun run approve test/acceptance --role qa yourself",
  },
  {
    says: "settings.json registers an edit hook and a Stop hook that run commands",
    test: (folder) =>
      hookCommand(folder, "PreToolUse", "Edit") !== undefined &&
      hookCommand(folder, "PreToolUse", "Write") !== undefined &&
      hookCommand(folder, "Stop") !== undefined,
    tryNext: "ask Claude Code to add a PreToolUse hook for Edit and Write, and a Stop hook",
  },
  {
    says: "the edit hook exits 2 when Claude edits a file in test/acceptance",
    test: (folder) => editHookExit(folder, "test/acceptance/ac-1-wrench.test.ts") === 2,
    tryNext: "the hook must exit 2 for any path under test/acceptance/; run it by hand to see",
  },
  {
    says: "the edit hook exits 0 when Claude edits a file in src",
    test: (folder) => editHookExit(folder, "src/wrenches.ts") === 0,
    tryNext: "the hook must let src/ through with exit 0, or Claude cannot build anything",
  },
  {
    says: "the Stop hook exits 2 when a test is red and 0 when every test is green",
    test: (folder) => stopHookExit(folder, false) === 2 && stopHookExit(folder, true) === 0,
    tryNext: "the hook must run bun test, then exit 2 on a red run and 0 on a green one",
  },
] satisfies Rule[];
