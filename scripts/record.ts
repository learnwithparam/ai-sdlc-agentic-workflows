// bun run record <step-name>: a real, headless Claude Code run for a step, saved for its check.
//
// It runs claude -p in kestrel/ with the step's prompt (see config/claude-code.ts) and saves the
// stream-json lines to kestrel/recordings/<step-name>/run-N.jsonl. Run it up to 3 times:
// behaviour that varies from run to run is judged on 2 of 3 runs.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readRun, withoutModelNames } from "../checks/lib/recordings";
import { headlessArguments, RECORDED_RUNS } from "../config/claude-code";
import { describeRun } from "./run-summary";
import { WORKSPACE } from "./structure";

function stop(message: string): never {
  console.log(message);
  process.exit(1);
}

function nextRunFile(folder: string): string {
  mkdirSync(folder, { recursive: true });
  const runCount = readdirSync(folder).filter((name) => name.endsWith(".jsonl")).length;
  return join(folder, `run-${runCount + 1}.jsonl`);
}

export function recordRun(stepName: string, kestrelFolder: string): string {
  const recordedRun = RECORDED_RUNS[stepName];
  if (!recordedRun) stop(`The step "${stepName}" has no recorded run.`);
  const outputFile = nextRunFile(join(kestrelFolder, "recordings", stepName));
  console.log(`Running Claude Code for ${stepName}. This makes a real call and takes a minute.`);
  const result = Bun.spawnSync(["claude", ...headlessArguments(recordedRun)], {
    cwd: kestrelFolder,
    stdout: "pipe",
    stderr: "inherit",
  });
  writeFileSync(outputFile, withoutModelNames(result.stdout.toString()));
  return outputFile;
}

if (import.meta.main) {
  const stepName = process.argv[2];
  if (!stepName) stop(`Name a step: ${Object.keys(RECORDED_RUNS).join(", ")}`);
  if (!existsSync(WORKSPACE)) stop("There is no kestrel/ yet. Run: bun run start meet-kestrel");
  if (Bun.spawnSync(["claude", "auth", "status"]).exitCode !== 0) {
    stop("Claude Code is not signed in. Run claude, then /login.");
  }
  const outputFile = recordRun(stepName, WORKSPACE);
  const relativeFile = outputFile.replace(`${WORKSPACE}/`, "");
  for (const line of describeRun(readRun(WORKSPACE, relativeFile))) console.log(line);
  console.log(`Saved the run to kestrel/${relativeFile}`);
}
