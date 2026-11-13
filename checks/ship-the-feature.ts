// ship-the-feature: the Goal of the course. It walks the whole chain in checks/lib/chain.ts,
// like bun run finished: every gate signed in order, every acceptance criterion traced to a test
// and a small commit in the plan, the world contract, the incident's test, and CHAIN.md.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { approvalHolds, approvedInOrder } from "./lib/approvals";
import { CHAIN } from "./lib/chain";
import { readFile } from "./lib/files";
import type { Rule } from "./lib/rule";
import { queueIsDueFirst, withWorld, wrenchLeavesTheFeed } from "./lib/world";
import { countedCommits, METRICS } from "./measure-the-lifecycle";
import { sizeLimitOf } from "./write-the-team-playbook";

const SPEC = "work/spec.md";
const PLAN = "work/plan.md";
const CHAIN_NOTE = "CHAIN.md";

function criteriaIds(folder: string): string[] {
  const ids = readFile(folder, SPEC).match(/\bAC-\d+\b/g) ?? [];
  return [...new Set(ids)];
}

function acceptanceTestText(folder: string): string {
  const testFolder = join(folder, "test", "acceptance");
  const names = readdirSync(testFolder).filter((name) => name.endsWith(".test.ts"));
  return names.map((name) => `${name}\n${readFile(testFolder, name)}`).join("\n");
}

// A test file named ac-1-... or a test that says AC-1 covers the criterion AC-1.
function everyCriterionHasTest(folder: string): boolean {
  const ids = criteriaIds(folder);
  const tests = acceptanceTestText(folder).toLowerCase();
  return ids.length > 0 && ids.every((id) => tests.includes(id.toLowerCase()));
}

// The postmortem's action item A-1 is a regression test, so test/regression must not be empty.
function testsPass(folder: string): boolean {
  const regressionFolder = join(folder, "test", "regression");
  const regressionTests = existsSync(regressionFolder) ? readdirSync(regressionFolder) : [];
  if (!regressionTests.some((name) => name.endsWith(".test.ts"))) return false;
  const result = Bun.spawnSync(["bun", "test"], { cwd: folder, timeout: 240_000 });
  return result.exitCode === 0;
}

const buildCommits = (folder: string) =>
  countedCommits(folder).filter((commit) => /^P-\d+/.test(commit.subject));

function planLineFor(folder: string, item: string): string {
  const lines = readFile(folder, PLAN).split("\n");
  return lines.find((line) => new RegExp(`\\b${item}\\b`).test(line)) ?? "";
}

// AC-1 is traced when a P- commit names it, or when the plan item that commit builds names it.
function everyCriterionHasCommit(folder: string): boolean {
  const commits = buildCommits(folder);
  const traced = (id: string) =>
    commits.some((commit) => {
      const item = commit.subject.match(/^P-\d+/)?.[0] ?? "";
      return commit.body.includes(id) || planLineFor(folder, item).includes(id);
    });
  const ids = criteriaIds(folder);
  return ids.length > 0 && ids.every(traced);
}

function everyBuildCommitIsInThePlan(folder: string): boolean {
  const commits = buildCommits(folder);
  const inPlan = (subject: string) => planLineFor(folder, subject.match(/^P-\d+/)?.[0] ?? "");
  return commits.length > 0 && commits.every((commit) => inPlan(commit.subject) !== "");
}

function testsCameBeforeCode(folder: string): boolean {
  const commits = countedCommits(folder);
  const firstTest = commits.findIndex((commit) =>
    commit.files.some((file) => file.startsWith("test/acceptance/")),
  );
  const firstBuild = commits.findIndex((commit) => /^P-\d+/.test(commit.subject));
  return firstTest >= 0 && firstBuild > firstTest;
}

function codeCommitsAreSmall(folder: string): boolean {
  const limit = sizeLimitOf(folder);
  const commits = countedCommits(folder).filter((commit) => /^(P|A)-\d+/.test(commit.subject));
  return commits.length > 0 && commits.every((commit) => commit.changedLines <= limit);
}

function gatesInOrder(folder: string): boolean {
  return CHAIN.slice(1).every((gate, index) =>
    approvedInOrder(folder, CHAIN[index].file, gate.file),
  );
}

async function worldContractHolds(folder: string): Promise<boolean> {
  return withWorld(folder, async (world) => {
    const leaves = await wrenchLeavesTheFeed(world.url, "B-2207");
    return leaves && (await queueIsDueFirst(world.url, "North"));
  });
}

// CHAIN.md is the learner's write-up: three numbers from metrics.md, and their limits.
function chainNoteHolds(folder: string): boolean {
  const note = readFile(folder, CHAIN_NOTE);
  const wordCount = note.split(/\s+/).filter(Boolean).length;
  const metrics = readFile(folder, METRICS);
  const numbers = note.replace(/`[^`]*`/g, " ").match(/\b\d+(\.\d+)?%?/g) ?? [];
  const shared = new Set(
    numbers.filter((number) => number.length >= 2 && metrics.includes(number)),
  );
  const saysTheLimit = /(do|does) not prove/i.test(note);
  return wordCount >= 400 && wordCount <= 800 && shared.size >= 3 && saysTheLimit;
}

export default [
  {
    says: `all ${CHAIN.length} gates in checks/lib/chain.ts are signed by the right role, and hold`,
    test: (folder) => CHAIN.every((gate) => approvalHolds(folder, gate.file, gate.role)),
    tryNext: "run bun run verify on each step to find the gate whose file changed after signing",
  },
  {
    says: "the gates were signed in the order of the lifecycle",
    test: gatesInOrder,
    tryNext: "a later stage was signed before an earlier one; sign them again in order",
  },
  {
    says: "every acceptance criterion in work/spec.md has a test in test/acceptance/",
    test: everyCriterionHasTest,
    tryNext: "ask Claude Code which AC id has no test, then add it with QA's approval",
  },
  {
    says: "every acceptance and regression test passes",
    test: testsPass,
    tryNext: "run bun test in kestrel/ and fix src/, never the tests",
  },
  {
    says: "every acceptance criterion is built by a P- commit, through work/plan.md",
    test: everyCriterionHasCommit,
    tryNext: "each P- commit names its plan item; each plan item names the AC ids it serves",
  },
  {
    says: "every P- commit builds an item that work/plan.md names",
    test: everyBuildCommitIsInThePlan,
    tryNext: "a commit built something the plan never had; add it to the plan and sign again",
  },
  {
    says: "the acceptance tests were committed before the first P- commit",
    test: testsCameBeforeCode,
    tryNext: "tests come first: a test written after the code cannot show it was red",
  },
  {
    says: "every P- and A- commit is within the size limit in CLAUDE.md",
    test: codeCommitsAreSmall,
    tryNext: "split the large commit into plan items under the limit",
  },
  {
    says: "the world contract holds: a wrench leaves the feed, the queue is due first",
    test: worldContractHolds,
    tryNext: "run bun run world in kestrel/ and wrench B-2207 to see what the feed shows",
  },
  {
    says: "CHAIN.md has 400 to 800 words, three numbers from metrics.md, and their limits",
    test: chainNoteHolds,
    tryNext: "ask Claude Code for CHAIN.md that quotes three numbers from work/metrics.md",
  },
] satisfies Rule[];
