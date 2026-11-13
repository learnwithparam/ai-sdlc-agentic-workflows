// bun run finished: the whole lifecycle chain, done, and checked.
//
// With Claude Code installed and signed in, it makes a real headless run: Claude Code builds the
// approved plan on a fresh copy of the chain, and the checks run on what it produced.
// With no Claude Code, in CI, or with --replay, it replays the recorded run in world/recordings/.
// Either way the checks read files and the running world, never Claude's reply.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { approvalHolds } from "../checks/lib/approvals";
import { CHAIN } from "../checks/lib/chain";
import { git } from "../checks/lib/git";
import { readRun, withoutModelNames } from "../checks/lib/recordings";
import { BASE_WORLD, buildSnapshot, overlay } from "../checks/lib/snapshot";
import { queueIsDueFirst, withWorld, wrenchLeavesTheFeed } from "../checks/lib/world";
import { FINISHED_RUN, headlessArguments } from "../config/claude-code";
import { describeRun } from "../scripts/run-summary";

const FINISHED_FOLDER = join(import.meta.dir, "finished");
const RECORDING_FOLDER = join(import.meta.dir, "recordings", "finished");
const RECORDING = "run-1.jsonl";
const LIVE_RUN_FOLDER = join(import.meta.dir, "..", ".finished-run");

type Outcome = { says: string; holds: boolean };

function canRunLive(): boolean {
  if (process.argv.includes("--replay") || process.env.CI) return false;
  try {
    return Bun.spawnSync(["claude", "auth", "status"]).exitCode === 0;
  } catch {
    return false;
  }
}

// The chain just before the build: every document approved, the code still as it was.
// It is built in .finished-run/, so you can open Claude Code's work after the run.
function buildBeginState(): string {
  const folder = LIVE_RUN_FOLDER;
  rmSync(folder, { recursive: true, force: true });
  cpSync(BASE_WORLD, folder, { recursive: true });
  overlay(FINISHED_FOLDER, folder);
  rmSync(join(folder, "src"), { recursive: true, force: true });
  cpSync(join(BASE_WORLD, "src"), join(folder, "src"), { recursive: true });
  git(folder, ["init", "--quiet", "--initial-branch=main"]);
  git(folder, ["config", "user.name", "Kestrel learner"]);
  git(folder, ["config", "user.email", "learner@kestrel.example"]);
  git(folder, ["add", "--all"]);
  git(folder, ["commit", "--quiet", "--message", "Begin build: the plan and tests are approved"]);
  return folder;
}

function runClaudeCode(folder: string): string {
  console.log("Claude Code is building the approved plan. This is a real run and takes minutes.");
  const result = Bun.spawnSync(["claude", ...headlessArguments(FINISHED_RUN)], {
    cwd: folder,
    stdout: "pipe",
    stderr: "inherit",
  });
  const transcript = result.stdout.toString();
  mkdirSync(join(folder, "recordings", "finished"), { recursive: true });
  writeFileSync(join(folder, "recordings", "finished", RECORDING), withoutModelNames(transcript));
  return transcript;
}

function testsPass(folder: string): boolean {
  return Bun.spawnSync(["bun", "test"], { cwd: folder, stdout: "ignore", stderr: "ignore" })
    .success;
}

async function checkTheChain(folder: string): Promise<Outcome[]> {
  const outcomes: Outcome[] = CHAIN.map((gate) => ({
    says: `${gate.stage}: ${gate.file} approved by ${gate.role}`,
    holds: approvalHolds(folder, gate.file, gate.role),
  }));
  outcomes.push({ says: "Every test passes, acceptance and regression", holds: testsPass(folder) });
  const contract = await withWorld(folder, async (world) => ({
    leaves: await wrenchLeavesTheFeed(world.url, "B-2207"),
    dueFirst: await queueIsDueFirst(world.url, "North"),
  }));
  outcomes.push({ says: "A wrenched bike leaves the public feed", holds: contract.leaves });
  outcomes.push({ says: "The North crew queue is due first", holds: contract.dueFirst });
  return outcomes;
}

function printOutcomes(outcomes: Outcome[]): boolean {
  for (const outcome of outcomes) {
    console.log(`  ${outcome.holds ? "PASS" : "FAIL"}  ${outcome.says}`);
  }
  const passing = outcomes.filter((outcome) => outcome.holds).length;
  const gates = `${CHAIN.length} gates`;
  if (passing === outcomes.length) {
    console.log(`The finished chain holds: ${gates}, tests pass, world contract passes.`);
    return true;
  }
  console.log(`${passing} of ${outcomes.length} links hold. The chain is broken.`);
  return false;
}

async function replay(): Promise<boolean> {
  console.log("This is a replay of a recorded run. No live Claude Code call is made.");
  for (const line of describeRun(readRun(RECORDING_FOLDER, RECORDING))) console.log(line);
  return printOutcomes(await checkTheChain(buildSnapshot(FINISHED_FOLDER)));
}

async function liveRun(): Promise<boolean> {
  const folder = buildBeginState();
  const transcript = runClaudeCode(folder);
  const lines = transcript.split("\n").filter(Boolean);
  for (const line of describeRun(lines.map((text) => JSON.parse(text)))) console.log(line);
  console.log("Claude Code's work is in .finished-run/");
  return printOutcomes(await checkTheChain(folder));
}

if (import.meta.main) {
  if (!existsSync(join(RECORDING_FOLDER, RECORDING)) && !canRunLive()) {
    console.log("There is no recorded run yet. See world/recordings/RECORD.md.");
    process.exit(2);
  }
  const held = canRunLive() ? await liveRun() : await replay();
  process.exit(held ? 0 : 1);
}

export { checkTheChain };
