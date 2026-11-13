// How this course runs Claude Code. The learner uses the real Claude Code, never the model API,
// and Claude Code picks its own model, so no file in this course names one.

// The oldest Claude Code the course is tested on. From this version, a headless run (claude -p)
// with no mode starts in manual mode, so every recording names its mode.
export const OLDEST_TESTED_VERSION = "2.1.302";

// The newest version we ran every recording with.
export const RECORDED_WITH_VERSION = "2.1.323";

// A recorded run: the prompt Claude Code gets in a headless run, and the limits around it.
export type RecordedRun = {
  prompt: string;
  permissionMode: "manual" | "acceptEdits" | "plan";
  maxTurns: number;
  maxBudgetUsd: number;
  allowedTools: string[];
};

// The headless flags every recording uses. stream-json needs --verbose with --print.
// Never --bare: it skips CLAUDE.md, skills and hooks, which are what the course builds.
export function headlessArguments(run: RecordedRun): string[] {
  return [
    "-p",
    run.prompt,
    "--output-format",
    "stream-json",
    "--verbose",
    "--permission-mode",
    run.permissionMode,
    "--max-turns",
    String(run.maxTurns),
    "--max-budget-usd",
    String(run.maxBudgetUsd),
    "--setting-sources",
    "project,local",
    "--no-session-persistence",
    ...run.allowedTools.flatMap((tool) => ["--allowedTools", tool]),
  ];
}

// One recorded run per step that needs one. bun run record <step-name> runs it in kestrel/.
export const RECORDED_RUNS: Record<string, RecordedRun> = {
  "ready-the-repo": {
    prompt:
      "The city now allows 72 hours for a wrenched bike. Change the 48 hour figure in " +
      "data/contract/sla.yaml to 72. Edit the file directly.",
    permissionMode: "acceptEdits",
    maxTurns: 6,
    maxBudgetUsd: 1,
    allowedTools: [],
  },
};

// The finished run: Claude Code builds the approved plan on a fresh copy of the finished chain.
export const FINISHED_RUN: RecordedRun = {
  prompt:
    "Build the approved plan in work/plan.md, one plan item at a time. " +
    "Read work/spec.md first. Make the acceptance tests in test/acceptance pass " +
    "without changing them. Run bun test after each item. Commit each item on its own " +
    "with a message that starts with the plan item id, for example 'P-1: ...'.",
  permissionMode: "acceptEdits",
  maxTurns: 60,
  maxBudgetUsd: 5,
  allowedTools: ["Bash(bun test *)", "Bash(git add *)", "Bash(git commit *)", "Bash(git diff *)"],
};
