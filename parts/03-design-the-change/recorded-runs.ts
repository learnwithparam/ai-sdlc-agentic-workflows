// For course authors: the headless run this part's write-the-contract-skill step records.
// A part session may not edit config/, so this entry waits here. The supervisor moves it into
// RECORDED_RUNS in config/claude-code.ts, and then bun run record write-the-contract-skill works.
import type { RecordedRun } from "../../config/claude-code";

export const DESIGN_RECORDED_RUNS: Record<string, RecordedRun> = {
  "write-the-contract-skill": {
    prompt:
      "Draft a short spec for a rider-facing change to wrench reports: when a rider wrenches " +
      "a bike, the app shows them when a crew must fix it. Give the acceptance criteria in " +
      "your reply only. Do not write or change any file.",
    permissionMode: "manual",
    maxTurns: 10,
    maxBudgetUsd: 1,
    allowedTools: [],
  },
};
