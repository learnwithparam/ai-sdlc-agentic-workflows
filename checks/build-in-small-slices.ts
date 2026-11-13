// build-in-small-slices: Claude Code built the plan one item at a time, each commit small enough
// to review, the signed tests untouched, and the running service now keeps the contract.

import { approvalHolds } from "./lib/approvals";
import { readFile } from "./lib/files";
import { type Commit, commitsOf, git, hasHistory } from "./lib/git";
import type { Rule } from "./lib/rule";
import { queueIsDueFirst, withWorld, wrenchLeavesTheFeed } from "./lib/world";

const TESTS = "test/acceptance";
const PLAN = "work/plan.md";
const LARGEST_COMMIT = 200;
const FEWEST_SLICES = 2;
const BIKE = "B-2207";

const touches = (commit: Commit, path: string) =>
  commit.files.some((file) => file.startsWith(path));

// The commits that changed the code, after the acceptance tests were committed.
function buildCommits(folder: string): Commit[] {
  const commits = commitsOf(folder).slice(1);
  const testCommit = commits.findIndex((commit) => touches(commit, TESTS));
  const afterTests = testCommit < 0 ? commits : commits.slice(testCommit + 1);
  return afterTests.filter((commit) => touches(commit, "src/"));
}

// Lines added plus lines removed, as git show --numstat counts them.
function changedLines(folder: string, commit: Commit): number {
  const numbers = git(folder, ["show", "--numstat", "--format=", commit.hash]);
  const rows = numbers.trim().split("\n").filter(Boolean);
  const perFile = rows.map((row) => row.split("\t"));
  return perFile.reduce((total, [added, removed]) => total + Number(added) + Number(removed), 0);
}

function planItemIds(folder: string): string[] {
  return readFile(folder, PLAN).match(/\bP-\d+\b/g) ?? [];
}

function namesPlanItem(folder: string, commit: Commit): boolean {
  const named = commit.subject.match(/\bP-\d+\b/)?.[0];
  return named !== undefined && planItemIds(folder).includes(named);
}

function slicesAreSmallAndNamed(folder: string): boolean {
  const slices = buildCommits(folder);
  const small = slices.every((commit) => changedLines(folder, commit) <= LARGEST_COMMIT);
  const named = slices.every((commit) => namesPlanItem(folder, commit));
  return slices.length >= FEWEST_SLICES && small && named;
}

// A build commit may only change files the plan names.
function stayedInsideThePlan(folder: string): boolean {
  const plan = readFile(folder, PLAN);
  const changed = buildCommits(folder).flatMap((commit) => commit.files);
  return changed.length > 0 && changed.every((file) => plan.includes(file));
}

function allTestsPass(folder: string): boolean {
  const run = Bun.spawnSync(["bun", "test"], { cwd: folder, env: process.env });
  return run.exitCode === 0;
}

export default [
  {
    says: "bun test passes, the acceptance tests included",
    test: allTestsPass,
    tryNext: "ask Claude Code which test fails and which plan item fixes it",
  },
  {
    says: "the acceptance tests are byte for byte as the qa role approved them",
    test: (folder) => approvalHolds(folder, TESTS, "qa"),
    tryNext: "git checkout the approved tests, then ask Claude Code to change the code instead",
  },
  {
    says: "2 or more code commits after the tests, each named P-n, under 200 lines",
    test: (folder) => hasHistory(folder) && slicesAreSmallAndNamed(folder),
    tryNext: 'ask Claude Code to commit one plan item at a time, each message starting "P-2:"',
  },
  {
    says: "every file a build commit changed is named in plan.md",
    test: (folder) => hasHistory(folder) && stayedInsideThePlan(folder),
    tryNext: "ask Claude Code to stop and update plan.md before it changes a file the plan lacks",
  },
  {
    says: "the running spoke shows a wrenched bike as is_disabled: true within 60 seconds",
    test: (folder) => withWorld(folder, (world) => wrenchLeavesTheFeed(world.url, BIKE)),
    tryNext: "run bun run world in kestrel/, send POST /wrench, and read vehicle_status.json",
  },
  {
    says: "the running spoke lists the North crew queue with the job due first on top",
    test: (folder) => withWorld(folder, (world) => queueIsDueFirst(world.url, "North")),
    tryNext: "ask Claude Code to sort GET /crew/queue by deadline, the earliest first",
  },
] satisfies Rule[];
