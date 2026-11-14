// build-in-parallel: the same plan items, built side by side on slice branches and merged.
// The check reads the git history for merges of slice/ branches whose files do not overlap.

import {
  allTestsPass,
  buildCommits,
  changedLines,
  stayedInsideThePlan,
} from "./build-in-small-slices";
import { approvalHolds } from "./lib/approvals";
import { readFile } from "./lib/files";
import { git, hasHistory } from "./lib/git";
import type { Rule } from "./lib/rule";

const FEWEST_SLICES = 2;
const TESTS = "test/acceptance";

// A merge of a slice branch: the files that branch brought in, read from the merge itself.
function sliceMerges(folder: string): string[][] {
  const log = git(folder, ["log", "--merges", "--format=%H %P|%s"]);
  const merges = log.split("\n").filter((line) => /\|.*slice\//.test(line));
  return merges.map((line) => {
    const [hashes] = line.split("|");
    const [merge, firstParent] = hashes.split(" ");
    return git(folder, ["diff", "--name-only", firstParent, merge]).trim().split("\n");
  });
}

function slicesDidNotCollide(folder: string): boolean {
  const branches = sliceMerges(folder);
  const files = branches.flat().filter(Boolean);
  const nothingTwice = new Set(files).size === files.length;
  return branches.length >= FEWEST_SLICES && files.length > 0 && nothingTwice;
}

// work/slices.md says "- P-2: 27 lines". The number must match what git counts for that commit.
function diffsWereRead(folder: string): boolean {
  const log = readFile(folder, "work/slices.md");
  const slices = buildCommits(folder);
  const said = (commit: Commit) => {
    const id = commit.subject.match(/\bP-\d+\b/)?.[0] ?? "?";
    return new RegExp(`${id}:\\s*${changedLines(folder, commit)}\\s*lines`).test(log);
  };
  return slices.length >= FEWEST_SLICES && slices.every(said);
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
    says: "every file a build commit changed is named in plan.md",
    test: (folder) => hasHistory(folder) && stayedInsideThePlan(folder),
    tryNext: "ask Claude Code to stop and update plan.md before it changes a file the plan lacks",
  },
  {
    says: "two or more slices were built side by side on slice/ branches, merged without overlap",
    test: (folder) => hasHistory(folder) && slicesDidNotCollide(folder),
    tryNext:
      "run claude -w for each slice, then merge each branch; slices must touch different files",
  },
  {
    says: "work/slices.md gives the changed-line count of each build commit, and git agrees",
    test: (folder) => hasHistory(folder) && diffsWereRead(folder),
    tryNext: "run git show --numstat on each commit and write its count, such as P-2: 27 lines",
  },
] satisfies Rule[];
