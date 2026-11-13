// bun run start <step-name>     make kestrel/ the begin state of a step
// bun run catch-up <step-name>  make kestrel/ the end state of a step, copied from its sample
//
// kestrel/ is your own Kestrel repo, with its own git history. Claude Code runs inside it.
// If kestrel/ already exists, it is moved to .kestrel-backups/ first, never deleted.
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { git } from "../checks/lib/git";
import { BASE_WORLD, overlay } from "../checks/lib/snapshot";
import { allSteps, findStep, ROOT, type Step, WORKSPACE } from "./structure";

const BACKUPS = join(ROOT, ".kestrel-backups");

function backUpWorkspace(): string | undefined {
  if (!existsSync(WORKSPACE)) return undefined;
  mkdirSync(BACKUPS, { recursive: true });
  const backup = join(BACKUPS, `kestrel-${readdirSync(BACKUPS).length + 1}`);
  renameSync(WORKSPACE, backup);
  return backup;
}

function makeWorkspace(snapshot: string) {
  const bundle = join(snapshot, "history.bundle");
  if (existsSync(bundle)) Bun.spawnSync(["git", "clone", "--quiet", bundle, WORKSPACE]);
  else cpSync(BASE_WORLD, WORKSPACE, { recursive: true });
  overlay(snapshot, WORKSPACE);
}

// A fresh repo gets a first commit, so every later stage shows up in git history.
function commitBeginState(message: string) {
  if (!existsSync(join(WORKSPACE, ".git"))) {
    git(WORKSPACE, ["init", "--quiet", "--initial-branch=main"]);
  }
  if (git(WORKSPACE, ["config", "user.name"]).trim() === "") {
    git(WORKSPACE, ["config", "user.name", "Kestrel learner"]);
    git(WORKSPACE, ["config", "user.email", "learner@kestrel.example"]);
  }
  git(WORKSPACE, ["add", "--all"]);
  git(WORKSPACE, ["commit", "--quiet", "--allow-empty", "--message", message]);
}

function listStepsAndStop(command: string, name: string | undefined): never {
  if (name) console.log(`There is no step called "${name}". Steps:`);
  else console.log("Name a step. Steps:");
  for (const step of allSteps()) console.log(`  bun run ${command} ${step.name}`);
  process.exit(1);
}

function startStep(step: Step, atTheEnd: boolean) {
  const snapshot = join(step.dir, atTheEnd ? "solution" : "problem");
  const backup = backUpWorkspace();
  if (backup) console.log(`Your old kestrel/ is safe in ${backup.replace(`${ROOT}/`, "")}`);
  makeWorkspace(snapshot);
  if (atTheEnd) {
    commitBeginState(`Catch up: the end of ${step.name}, copied from the sample`);
    console.log(`kestrel/ is now at the end of ${step.name}, copied from the sample solution.`);
    return;
  }
  commitBeginState(`Begin ${step.name}`);
  console.log(`kestrel/ is ready at the start of ${step.name}.`);
  console.log("Open Claude Code there: cd kestrel && claude");
}

if (import.meta.main) {
  const [mode, name] = process.argv.slice(2);
  const atTheEnd = mode === "end";
  const step = name ? findStep(name) : undefined;
  if (!step) listStepsAndStop(atTheEnd ? "catch-up" : "start", name);
  startStep(step, atTheEnd);
}
