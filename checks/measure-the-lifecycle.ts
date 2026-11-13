// measure-the-lifecycle: the team's own numbers, read from the deploy log and from git.
// The check works out every number itself and compares: the four DORA keys within 5%, the git
// numbers exactly. Each number must name the command that produced it, so anyone can run it again.

import { readFile, sectionOf } from "./lib/files";
import { git } from "./lib/git";
import type { Rule } from "./lib/rule";
import { BASE_WORLD } from "./lib/snapshot";

export const METRICS = "work/metrics.md";
const DORA_TOLERANCE = 0.05;
const HOUR = 60 * 60 * 1000;
const LAST_COUNTED_SUBJECT = "approve: work/intent/next-dedupe-wrenches.md by pm";
const CLAUDE_TRAILER = "Co-Authored-By: Claude";

const metricsOf = (folder: string) => readFile(folder, METRICS);

function csvRows(path: string): Record<string, string>[] {
  const [headerLine, ...lines] = readFile(BASE_WORLD, path).trim().split("\n");
  const header = headerLine.split(",");
  return lines.map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ""]));
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

const hoursBetween = (start: string, end: string) => (Date.parse(end) - Date.parse(start)) / HOUR;

export type DoraKeys = {
  deploys: number;
  deploysPerWeek: number;
  leadTimeHours: number;
  changeFailurePercent: number;
  restoreHours: number;
};

// For example: 69 deploys, a median lead time of 66 hours, 9 of 69 deploys failed.
export function doraKeys(): DoraKeys {
  const deploys = csvRows("data/deploys.csv");
  const incidents = csvRows("data/incidents.csv");
  const deployTimes = deploys.map((deploy) => Date.parse(deploy.deployed_at));
  const spanWeeks = (Math.max(...deployTimes) - Math.min(...deployTimes)) / (7 * 24 * HOUR);
  const leadTimes = deploys.map((deploy) => hoursBetween(deploy.committed_at, deploy.deployed_at));
  const failed = deploys.filter((deploy) => deploy.incident_id !== "");
  const restoreTimes = incidents.map((incident) =>
    hoursBetween(incident.started_at, incident.resolved_at),
  );
  return {
    deploys: deploys.length,
    deploysPerWeek: deploys.length / spanWeeks,
    leadTimeHours: median(leadTimes),
    changeFailurePercent: (100 * failed.length) / deploys.length,
    restoreHours: median(restoreTimes),
  };
}

type CountedCommit = {
  subject: string;
  at: string;
  body: string;
  files: string[];
  changedLines: number;
};

function parseCommit(block: string): CountedCommit {
  const [header, ...rest] = block.split("\n@@files\n");
  const [subject, at, ...bodyLines] = header.split("\n");
  const statLines = (rest[0] ?? "").split("\n").filter((line) => /^\d+\t\d+\t/.test(line));
  const files = statLines.map((line) => line.split("\t")[2]);
  const changedLines = statLines.reduce((total, line) => {
    const [added, removed] = line.split("\t").map(Number);
    return total + added + removed;
  }, 0);
  return { subject, at, body: bodyLines.join("\n"), files, changedLines };
}

// Oldest first, up to and including the pm's approval of the next intent: the end of Part 7.
// Later commits, such as the one that adds metrics.md, would change the numbers they report.
export function countedCommits(folder: string): CountedCommit[] {
  const format = "--format=@@commit%n%s%n%aI%n%b%n@@files";
  const log = git(folder, ["log", "--reverse", "--numstat", format]);
  const commits = log.split("@@commit\n").filter(Boolean).map(parseCommit);
  const lastIndex = commits.findIndex((commit) => commit.subject === LAST_COUNTED_SUBJECT);
  return lastIndex < 0 ? commits : commits.slice(0, lastIndex + 1);
}

export type GitNumbers = {
  intentToSpecHours: number;
  specCommitsAfterPlan: number;
  filesOutsidePlan: number;
  claudeSharePercent: number;
  medianCommitSize: number;
};

const touches = (commit: CountedCommit, file: string) => commit.files.includes(file);

function filesOutsidePlan(folder: string, commits: CountedCommit[]): number {
  const plan = readFile(folder, "work/plan.md");
  const buildCommits = commits.filter((commit) => /^P-\d+/.test(commit.subject));
  const changed = new Set(buildCommits.flatMap((commit) => commit.files));
  return [...changed].filter((file) => !plan.includes(file)).length;
}

export function gitNumbers(folder: string): GitNumbers {
  const commits = countedCommits(folder);
  const firstIntent = commits.find((commit) => touches(commit, "work/intent.md"));
  const firstSpec = commits.find((commit) => touches(commit, "work/spec.md"));
  const firstPlanIndex = commits.findIndex((commit) => touches(commit, "work/plan.md"));
  const afterPlan = firstPlanIndex < 0 ? [] : commits.slice(firstPlanIndex + 1);
  const byClaude = commits.filter((commit) => commit.body.includes(CLAUDE_TRAILER));
  const sizes = commits.slice(1).map((commit) => commit.changedLines);
  return {
    intentToSpecHours: hoursBetween(firstIntent?.at ?? "", firstSpec?.at ?? ""),
    specCommitsAfterPlan: afterPlan.filter((commit) => touches(commit, "work/spec.md")).length,
    filesOutsidePlan: filesOutsidePlan(folder, commits),
    claudeSharePercent: (100 * byClaude.length) / commits.length,
    medianCommitSize: median(sizes),
  };
}

// The lines of metrics.md that name this number, each with a command in backticks.
function linesAbout(folder: string, label: RegExp): string[] {
  const lines = metricsOf(folder).split("\n");
  return lines.filter((line) => label.test(line) && /`[^`]+`/.test(line));
}

function numbersIn(line: string): number[] {
  const withoutCommands = line.replace(/`[^`]*`/g, " ");
  const found = withoutCommands.replaceAll(",", "").match(/-?\d+(\.\d+)?/g) ?? [];
  return found.map(Number);
}

type Match = (value: number) => boolean;

function reports(folder: string, label: RegExp, matches: Match): boolean {
  return linesAbout(folder, label).some((line) => numbersIn(line).some(matches));
}

const within = (expected: number, share: number) => (value: number) =>
  Math.abs(value - expected) <= Math.abs(expected) * share;

const nearly = (expected: number, gap: number) => (value: number) =>
  Math.abs(value - expected) <= gap;

const either =
  (...matchers: Match[]) =>
  (value: number) =>
    matchers.some((matcher) => matcher(value));

function doraRule(says: string, label: RegExp, matches: () => Match): Rule {
  return {
    says: `${says}, within 5% of the check's count, with its command`,
    test: (folder) => reports(folder, label, matches()),
    tryNext: `ask Claude Code to work this out from data/deploys.csv and data/incidents.csv`,
  };
}

function gitRule(says: string, label: RegExp, matches: (folder: string) => Match): Rule {
  return {
    says: `${says}, exactly as git shows it, with its command`,
    test: (folder) => reports(folder, label, matches(folder)),
    tryNext: "ask Claude Code to run the git command again and copy the number it prints",
  };
}

const keys = doraKeys;
const numbersFor = gitNumbers;

export default [
  doraRule(
    "deployment frequency: deploys in total or per week",
    /deploy(ment)?s? (frequency|per)|^\|?\s*deploys\b/i,
    () =>
      either(within(keys().deploys, DORA_TOLERANCE), within(keys().deploysPerWeek, DORA_TOLERANCE)),
  ),
  doraRule("lead time for changes, the median in hours or days", /lead time/i, () =>
    either(
      within(keys().leadTimeHours, DORA_TOLERANCE),
      within(keys().leadTimeHours / 24, DORA_TOLERANCE),
    ),
  ),
  doraRule("change failure rate, as a percent", /change failure/i, () =>
    within(keys().changeFailurePercent, DORA_TOLERANCE),
  ),
  doraRule("time to restore, the median in hours", /restore|recover/i, () =>
    either(
      within(keys().restoreHours, DORA_TOLERANCE),
      within(keys().restoreHours * 60, DORA_TOLERANCE),
    ),
  ),
  gitRule(
    "hours from the first intent commit to the first spec commit",
    /intent to spec/i,
    (folder) =>
      either(
        nearly(numbersFor(folder).intentToSpecHours, 0.05),
        nearly(numbersFor(folder).intentToSpecHours * 60, 0.5),
      ),
  ),
  gitRule("commits that changed spec.md after the first plan commit", /spec .*after/i, (folder) =>
    nearly(numbersFor(folder).specCommitsAfterPlan, 0),
  ),
  gitRule("files the P- commits changed that plan.md does not name", /outside .*plan/i, (folder) =>
    nearly(numbersFor(folder).filesOutsidePlan, 0),
  ),
  gitRule(
    "share of commits with the Claude Code trailer, as a percent",
    /trailer|co-authored/i,
    (folder) => nearly(numbersFor(folder).claudeSharePercent, 0.5),
  ),
  gitRule("median commit size in changed lines", /median commit size/i, (folder) =>
    nearly(numbersFor(folder).medianCommitSize, 0),
  ),
  {
    says: "a section says what these numbers do not prove, next to DORA or METR",
    test: (folder) => {
      const section = sectionOf(metricsOf(folder), "What these numbers do not prove");
      return /\b(DORA|METR)\b/.test(section) && section.split(/\s+/).length >= 12;
    },
    tryNext:
      "ask for a ## What these numbers do not prove section that compares one number to DORA",
  },
] satisfies Rule[];
