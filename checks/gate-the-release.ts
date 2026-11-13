// gate-the-release: a rollout one district at a time, with guardrails taken from the city
// contract and a rollback that runs. The release manager signs it. Claude Code may act up to the
// production gate and cannot pass it: a recorded run shows the ask rule stopping the deploy.

import { approvalHolds, approvedInOrder, latestApproval } from "./lib/approvals";
import { readFile, readJson } from "./lib/files";
import { deniedCallsOf, type RunLine, runsFor } from "./lib/recordings";
import type { Rule } from "./lib/rule";
import { readPermissions, ruleCovers } from "./lib/settings";

const ROLLOUT_FILE = "work/rollout.yaml";
const CONTRACT = "data/contract/sla.yaml";
const DEPLOY = "deploy:production";
const DEPLOYED_LINE = "Deployed spoke to production";

type Stage = { district?: string; districts?: string[] };
type Guardrail = { metric?: string; stop_below?: number; stop_above?: number };
type Rollout = {
  feature_flag?: string;
  stages?: Stage[];
  guardrails?: Guardrail[];
  rollback?: { command?: string; when?: string };
};

function readRollout(folder: string): Rollout | undefined {
  try {
    const parsed = Bun.YAML.parse(readFile(folder, ROLLOUT_FILE));
    return parsed && typeof parsed === "object" ? (parsed as Rollout) : undefined;
  } catch {
    return undefined;
  }
}

// The districts in data/stations.csv, for example North, East and Centre.
function knownDistricts(folder: string): Set<string> {
  const rows = readFile(folder, "data/stations.csv").trim().split("\n").slice(1);
  return new Set(rows.map((row) => row.split(",")[2]));
}

function districtsOf(stage: Stage): string[] {
  if (stage.districts) return stage.districts;
  return stage.district ? [stage.district] : [];
}

function rollsOutByDistrict(folder: string): boolean {
  const stages = readRollout(folder)?.stages ?? [];
  const districts = knownDistricts(folder);
  const everyNameIsReal = stages.every((stage) => {
    const names = districtsOf(stage);
    return names.length > 0 && names.every((name) => districts.has(name));
  });
  return stages.length >= 2 && everyNameIsReal;
}

// Every number in the contract, for example 48, 96, 95, 50, 96, 4 and 60.
function contractNumbers(folder: string): Set<number> {
  const numbers = readFile(folder, CONTRACT).match(/:\s*\d+(\.\d+)?\s*$/gm) ?? [];
  return new Set(numbers.map((match) => Number(match.replace(":", ""))));
}

function thresholdOf(guardrail: Guardrail): number | undefined {
  return guardrail.stop_below ?? guardrail.stop_above;
}

function guardrailsComeFromTheContract(folder: string): boolean {
  const guardrails = readRollout(folder)?.guardrails ?? [];
  const allowed = contractNumbers(folder);
  const fromContract = (guardrail: Guardrail) => allowed.has(Number(thresholdOf(guardrail)));
  return guardrails.length > 0 && guardrails.every(fromContract);
}

// The rollback must be a bun run script that exists, and it must say it rolled spoke back.
function rollbackRuns(folder: string): boolean {
  const command = readRollout(folder)?.rollback?.command ?? "";
  const scriptName = command.match(/^bun run ([\w:-]+)$/)?.[1];
  const manifest = readJson(folder, "package.json") as { scripts?: Record<string, string> };
  if (!scriptName || !manifest?.scripts?.[scriptName]) return false;
  const result = Bun.spawnSync(["bun", "run", scriptName], { cwd: folder, stderr: "pipe" });
  return result.stdout.toString().includes("Rolled spoke back");
}

function settingsStillAsk(folder: string): boolean {
  const permissions = readPermissions(folder);
  if (!permissions) return false;
  const asks = ruleCovers(permissions.ask, "Bash", DEPLOY);
  const allows = ruleCovers(permissions.allow, "Bash", DEPLOY);
  return asks && !allows;
}

const deployWasStopped = (run: RunLine[]) =>
  deniedCallsOf(run).some((denial) => String(denial.tool_input.command ?? "").includes(DEPLOY));

// A deploy that ran prints its line in a tool result, inside the run's transcript.
const deployRan = (run: RunLine[]) => JSON.stringify(run).includes(DEPLOYED_LINE);

// Any production deploy in kestrel's deploy log must come after the release manager signed.
function noDeployBeforeTheGate(folder: string): boolean {
  const approval = latestApproval(folder, ROLLOUT_FILE, "release-manager");
  const productionLines = readFile(folder, "logs/deploys.log")
    .split("\n")
    .filter((line) => line.endsWith(" production"));
  if (!approval) return productionLines.length === 0;
  const signedAt = Date.parse(approval.at);
  return productionLines.every((line) => Date.parse(line.split(" ")[0]) > signedAt);
}

const RECORD_COMMAND = "bun parts/06-release-the-change/02-gate-the-release/record.ts";

export default [
  {
    says: "work/rollout.yaml parses and has feature_flag, stages, guardrails and rollback",
    test: (folder) => {
      const rollout = readRollout(folder);
      return Boolean(
        rollout?.feature_flag && rollout.stages && rollout.guardrails && rollout.rollback,
      );
    },
    tryNext: "ask Claude Code for the four keys: feature_flag, stages, guardrails, rollback",
  },
  {
    says: "the rollout has at least 2 stages, each naming real districts",
    test: rollsOutByDistrict,
    tryNext: "ask Claude Code to stage the rollout by the districts in data/stations.csv",
  },
  {
    says: "every guardrail threshold is a number from data/contract/sla.yaml",
    test: guardrailsComeFromTheContract,
    tryNext: "ask Claude Code to take every threshold from sla.yaml and name its SLA id",
  },
  {
    says: "the rollback command is in package.json and rolls spoke back",
    test: rollbackRuns,
    tryNext: "ask Claude Code to use command: bun run rollback, which exists in package.json",
  },
  {
    says: ".claude/settings.json still asks a person before bun run deploy:production",
    test: settingsStillAsk,
    tryNext: "keep Bash(bun run deploy:production *) under ask, never under allow",
  },
  {
    says: "the release manager approved work/rollout.yaml, after the pm approved the notes",
    test: (folder) =>
      approvalHolds(folder, ROLLOUT_FILE, "release-manager") &&
      approvedInOrder(folder, "work/release.md", ROLLOUT_FILE),
    tryNext: "read the plan, then run: bun run approve work/rollout.yaml --role release-manager",
  },
  {
    says: "a recorded run shows the deploy stopped by a permission rule",
    test: (folder) => runsFor(folder, "gate-the-release").some(deployWasStopped),
    tryNext: `run ${RECORD_COMMAND} again. Claude Code sometimes stops on its own first`,
  },
  {
    says: "no recorded run deployed, and nothing deployed before the release manager signed",
    test: (folder) =>
      !runsFor(folder, "gate-the-release").some(deployRan) && noDeployBeforeTheGate(folder),
    tryNext: "put the ask rule back, then record again. Only a person may say yes to a deploy",
  },
] satisfies Rule[];
