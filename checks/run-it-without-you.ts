// run-it-without-you: a headless Claude Code run with a contract, a loop, a schedule, a pull
// request review in CI, and metrics worked out from the runs you saved. The metrics are counted
// again from the saved stream-json runs, so a typed number that is not true fails.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileExists, readFile, sectionOf } from "./lib/files";
import { type RunLine, resultLineOf, runsFor } from "./lib/recordings";
import type { Rule } from "./lib/rule";

const FILE = "work/unattended.md";
const WORKFLOW = "work/review-action.yml";
const RUN_FOLDER = "run-it-without-you";
const FEWEST_RUNS = 2;
const COST_TOLERANCE = 0.05;

type Result = RunLine & { total_cost_usd?: number; num_turns?: number };

const section = (folder: string, name: string) => sectionOf(readFile(folder, FILE), name);
const results = (folder: string): Result[] =>
  runsFor(folder, RUN_FOLDER).map((run) => resultLineOf(run) as Result | undefined) as Result[];
const mean = (numbers: number[]) => numbers.reduce((sum, value) => sum + value, 0) / numbers.length;

function field(text: string, label: string): string {
  const lines = text.split("\n").map((line) => line.replace(/^[-*]\s*/, ""));
  const wanted = `${label.toLowerCase()}:`;
  const line = lines.find((one) => one.toLowerCase().startsWith(wanted));
  return line?.slice(line.indexOf(":") + 1).trim() ?? "";
}

function numberAfter(text: string, flag: string): number | undefined {
  const found = text.match(new RegExp(`${flag}\\s+([0-9.]+)`));
  return found ? Number(found[1]) : undefined;
}

function savedRunsAreGood(folder: string): boolean {
  const all = results(folder);
  const good = all.filter((one) => one?.subtype === "success" && one.is_error === false);
  return all.length >= FEWEST_RUNS && good.length === all.length;
}

function runsStayedInBudget(folder: string): boolean {
  const command = section(folder, "Command");
  const dollars = numberAfter(command, "--max-budget-usd");
  const turns = numberAfter(command, "--max-turns");
  if (dollars === undefined || turns === undefined) return false;
  const all = results(folder).filter(Boolean);
  const inside = (one: Result) =>
    (one.total_cost_usd ?? Infinity) <= dollars && (one.num_turns ?? Infinity) <= turns;
  return all.length >= FEWEST_RUNS && all.every(inside);
}

function metricsAreTrue(folder: string): boolean {
  const all = results(folder).filter(Boolean);
  if (all.length < FEWEST_RUNS) return false;
  const metrics = section(folder, "Metrics");
  const passed = all.filter((one) => one.subtype === "success").length;
  const cost = Number(field(metrics, "Cost per run").match(/[0-9.]+/)?.[0]);
  const trueCost = mean(all.map((one) => one.total_cost_usd ?? 0));
  const turns = Number(field(metrics, "Turns per run").match(/[0-9.]+/)?.[0]);
  const trueTurns = mean(all.map((one) => one.num_turns ?? 0));
  return (
    Number(field(metrics, "Runs")) === all.length &&
    Number(field(metrics, "Passed")) === passed &&
    Math.abs(cost - trueCost) <= trueCost * COST_TOLERANCE &&
    Math.abs(turns - trueTurns) < 0.5
  );
}

function contractIsComplete(folder: string): boolean {
  const contract = section(folder, "Run contract");
  const stop = field(contract, "Stop when");
  const never = field(contract, "Never");
  const names = ["Goal", "Budget", "Allowed tools"].every((label) => field(contract, label) !== "");
  return names && /`[^`]+`/.test(stop) && never.length > 4 && !/TODO/.test(contract);
}

type Workflow = {
  on?: Record<string, unknown>;
  permissions?: Record<string, string>;
  jobs?: Record<string, { "timeout-minutes"?: number; steps?: Record<string, unknown>[] }>;
};

function workflowOf(folder: string): Workflow | undefined {
  if (!fileExists(folder, WORKFLOW)) return undefined;
  try {
    return Bun.YAML.parse(readFileSync(join(folder, WORKFLOW), "utf8")) as Workflow;
  } catch {
    return undefined;
  }
}

const jobsOf = (workflow: Workflow) => Object.values(workflow.jobs ?? {});
const stepsOf = (workflow: Workflow) => jobsOf(workflow).flatMap((job) => job.steps ?? []);

function reviewRunsOnPullRequests(folder: string): boolean {
  const workflow = workflowOf(folder);
  if (!workflow) return false;
  const runsClaude = stepsOf(workflow).some((step) => {
    const text = JSON.stringify(step);
    return text.includes("claude-code-action") || text.includes("claude -p");
  });
  return "pull_request" in (workflow.on ?? {}) && runsClaude;
}

function workflowIsFenced(folder: string): boolean {
  const workflow = workflowOf(folder);
  if (!workflow) return false;
  const permissions = workflow.permissions ?? {};
  const readOnlyContents = permissions.contents === "read";
  const everyJobHasTimeout = jobsOf(workflow).every((job) => job["timeout-minutes"] !== undefined);
  const keyFromSecrets = readFile(folder, WORKFLOW).includes("secrets.");
  const typedKey = /sk-ant-/.test(readFile(folder, WORKFLOW));
  return readOnlyContents && everyJobHasTimeout && keyFromSecrets && !typedKey;
}

export default [
  {
    says: "the Command runs claude -p with a turn limit and a money limit",
    test: (folder) => {
      const command = section(folder, "Command");
      const limits =
        numberAfter(command, "--max-turns") && numberAfter(command, "--max-budget-usd");
      return command.includes("claude -p") && Boolean(limits);
    },
    tryNext: "write the command with claude -p, --max-turns 6 and --max-budget-usd 0.5",
  },
  {
    says: "2 or more saved runs finished with success",
    test: savedRunsAreGood,
    tryNext: "save each run with > recordings/run-it-without-you/run-1.jsonl, then run it twice",
  },
  {
    says: "every saved run stayed inside the turn and money limits of the Command",
    test: runsStayedInBudget,
    tryNext: "compare each run's cost and turns with the limits you wrote in the Command",
  },
  {
    says: "the Loop section has a /loop line with an interval",
    test: (folder) => /\/loop\s+\d+\s*[smh]\b/.test(section(folder, "Loop")),
    tryNext: "write a line such as /loop 30m run bun test and tell me if the count changes",
  },
  {
    says: "the Schedule section has a /schedule line with a timetable",
    test: (folder) =>
      /\/schedule\b.*\b(every|daily|weekday|hourly)/i.test(section(folder, "Schedule")),
    tryNext: "write a line such as /schedule every weekday at 08:00, run bun test",
  },
  {
    says: "the run contract has a goal, a stop condition in backticks, a budget, tools and a never",
    test: contractIsComplete,
    tryNext: "fill every line, and put the command that proves done in backticks after Stop when",
  },
  {
    says: "the metrics match the saved runs: count, passed, cost and turns per run",
    test: metricsAreTrue,
    tryNext: "read total_cost_usd and num_turns from each result line, then write the real means",
  },
  {
    says: "work/review-action.yml runs Claude Code on every pull request",
    test: reviewRunsOnPullRequests,
    tryNext: "write a workflow with on: pull_request and a step that uses claude-code-action",
  },
  {
    says: "the workflow reads contents only, has a timeout and takes its key from secrets",
    test: workflowIsFenced,
    tryNext: "set permissions contents: read, timeout-minutes on each job, and use secrets.",
  },
] satisfies Rule[];
