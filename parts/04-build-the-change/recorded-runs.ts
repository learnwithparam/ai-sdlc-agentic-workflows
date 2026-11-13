// For course authors: the headless run this part's plan-in-plan-mode step records.
// A part session may not edit config/, so this entry waits here. The supervisor moves it into
// RECORDED_RUNS in config/claude-code.ts, and then bun run record plan-in-plan-mode works.
import type { RecordedRun } from "../../config/claude-code";

export const BUILD_RECORDED_RUNS: Record<string, RecordedRun> = {
  "plan-in-plan-mode": {
    prompt:
      "Plan how to build the approved work/spec.md. Read the spec, the decision in " +
      "work/decisions/ and the code first. The plan needs four ## headings: Files that change, " +
      "Order of work, Risks, Proof. Give each work item an id (P-1, P-2 and so on) and name " +
      "the AC ids it serves. P-1 is the acceptance tests only, one file per AC id in " +
      "test/acceptance/. Nothing may touch data/contract/. Show me the whole plan.",
    permissionMode: "plan",
    maxTurns: 30,
    maxBudgetUsd: 2,
    allowedTools: [],
  },
};
