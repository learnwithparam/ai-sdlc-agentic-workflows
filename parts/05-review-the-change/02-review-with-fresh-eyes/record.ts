// bun parts/05-review-the-change/02-review-with-fresh-eyes/record.ts
//
// Real, headless Claude Code reviews for review-with-fresh-eyes. Claude Code reviews two
// teammate branches, 3 times each, with your reviewer subagent:
//   planted  origin/teammate/local-deadlines  has the clock-change bug. A good review finds it.
//   clean    origin/teammate/deadline-labels  does the same job safely. A good review stays quiet.
// A third branch has a planted security hole. Claude Code's own /security-review command reads it:
//   security origin/teammate/queue-search  builds a SQL query from the search word.
// Each run works in a fresh copy of kestrel/, so your own repo never changes. The transcript
// and the review it wrote are saved in kestrel/recordings/review-with-fresh-eyes/.
//
// For the supervisor: move REVIEW_RUNS into RECORDED_RUNS in config/claude-code.ts, so
// bun run record review-with-fresh-eyes can run them.
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { withoutModelNames } from "../../../checks/lib/recordings";
import { headlessArguments, type RecordedRun } from "../../../config/claude-code";
import { WORKSPACE } from "../../../scripts/structure";

export const RUNS_PER_BRANCH = 3;

export const BRANCHES = {
  planted: "origin/teammate/local-deadlines",
  clean: "origin/teammate/deadline-labels",
};

export const SECURITY_BRANCH = "origin/teammate/queue-search";

// /security-review looks at the changes on the branch you are on, so each run checks it out.
export const SECURITY_RUN: RecordedRun = {
  prompt: "/security-review",
  permissionMode: "acceptEdits",
  maxTurns: 30,
  maxBudgetUsd: 2,
  allowedTools: ["Bash(git diff *)", "Bash(git log *)", "Bash(git show *)", "Bash(git status *)"],
};

function reviewRun(branch: string): RecordedRun {
  return {
    prompt:
      `Use the reviewer subagent to review the branch ${branch} against main. ` +
      "Then write its findings to work/review.md: a one-line heading, the findings table " +
      "exactly as REVIEW.md asks, and a last line 'Important findings left open: N'.",
    permissionMode: "acceptEdits",
    maxTurns: 30,
    maxBudgetUsd: 2,
    allowedTools: ["Bash(git diff *)", "Bash(git log *)", "Bash(git show *)"],
  };
}

export const REVIEW_RUNS = {
  planted: reviewRun(BRANCHES.planted),
  clean: reviewRun(BRANCHES.clean),
};

type BranchKind = keyof typeof BRANCHES;

// A fresh copy of kestrel/ with no review in it yet.
function freshCopy(): string {
  const copy = join(mkdtempSync(join(tmpdir(), "kestrel-review-")), "kestrel");
  cpSync(WORKSPACE, copy, { recursive: true });
  rmSync(join(copy, "work", "review.md"), { force: true });
  return copy;
}

async function reviewOnce(kind: BranchKind, runNumber: number): Promise<string> {
  const copy = freshCopy();
  const claude = Bun.spawn(["claude", ...headlessArguments(REVIEW_RUNS[kind])], {
    cwd: copy,
    stdout: "pipe",
    stderr: "inherit",
  });
  const transcript = await new Response(claude.stdout).text();
  const saveFolder = join(WORKSPACE, "recordings", "review-with-fresh-eyes", kind);
  mkdirSync(saveFolder, { recursive: true });
  writeFileSync(join(saveFolder, `run-${runNumber}.jsonl`), withoutModelNames(transcript));
  const review = join(copy, "work", "review.md");
  if (existsSync(review)) cpSync(review, join(saveFolder, `review-${runNumber}.md`));
  return `${kind} run ${runNumber}: ${existsSync(review) ? "wrote" : "did not write"} a review`;
}

// The report /security-review prints is the last "result" line of the transcript.
function resultTextOf(transcript: string): string {
  for (const line of transcript.split("\n").reverse()) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === "result") return String(parsed.result ?? "");
    } catch {
      // Not a JSON line.
    }
  }
  return "";
}

async function securityReviewOnce(runNumber: number): Promise<string> {
  const copy = freshCopy();
  Bun.spawnSync(["git", "checkout", "--quiet", "-B", "queue-search", SECURITY_BRANCH], {
    cwd: copy,
  });
  const claude = Bun.spawn(["claude", ...headlessArguments(SECURITY_RUN)], {
    cwd: copy,
    stdout: "pipe",
    stderr: "inherit",
  });
  const transcript = await new Response(claude.stdout).text();
  const saveFolder = join(WORKSPACE, "recordings", "review-with-fresh-eyes", "security");
  mkdirSync(saveFolder, { recursive: true });
  writeFileSync(join(saveFolder, `run-${runNumber}.jsonl`), withoutModelNames(transcript));
  writeFileSync(join(saveFolder, `review-${runNumber}.md`), resultTextOf(transcript));
  return `security run ${runNumber}: saved the /security-review report`;
}

function claudeCodeIsSignedIn(): boolean {
  try {
    return Bun.spawnSync(["claude", "auth", "status"]).exitCode === 0;
  } catch {
    // There is no claude command on this computer.
    return false;
  }
}

function stop(message: string): never {
  console.log(message);
  process.exit(1);
}

if (import.meta.main) {
  if (!existsSync(WORKSPACE)) stop("There is no kestrel/ yet. Run: bun run start meet-kestrel");
  if (!claudeCodeIsSignedIn()) {
    stop("Claude Code is not installed or not signed in. Run claude, then /login.");
  }
  console.log("Claude Code is reviewing three branches, 3 times each. This takes a few minutes.");
  // Pass "security" to record only the /security-review runs.
  const onlySecurity = process.argv[2] === "security";
  const runs: Promise<string>[] = [];
  for (let runNumber = 1; runNumber <= RUNS_PER_BRANCH; runNumber++) {
    if (!onlySecurity) runs.push(reviewOnce("planted", runNumber), reviewOnce("clean", runNumber));
    runs.push(securityReviewOnce(runNumber));
  }
  for (const outcome of await Promise.all(runs)) console.log(outcome);
  console.log(`Saved ${runs.length} runs to kestrel/recordings/review-with-fresh-eyes/`);
}
