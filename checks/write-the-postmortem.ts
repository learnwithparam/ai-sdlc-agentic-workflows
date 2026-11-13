// write-the-postmortem: a blameless postmortem whose numbers come from the incident logs, whose
// action items each name a role and a check, and a regression test that is red on the build that
// broke and green on the fix.
//
// The check reads the logs from the course's own copy in world/incidents/, so editing the copy
// in kestrel/ never changes the answer.
import { cpSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { findStep, ROOT } from "../scripts/structure";
import { approvalHolds } from "./lib/approvals";
import { headingsOf, readFile, sectionOf } from "./lib/files";
import type { Rule } from "./lib/rule";
import { BASE_WORLD, buildSnapshot } from "./lib/snapshot";

export const POSTMORTEM = "work/postmortem.md";
const HEADINGS = [
  "Summary",
  "Impact",
  "Timeline",
  "Contributing factors",
  "What went well",
  "Action items",
];
const INCIDENT_LOGS = join(ROOT, "world", "incidents", "north-double-wrench");
const INCIDENT_BUILD = join(findStep("write-the-postmortem")?.dir ?? "", "problem");
const REGRESSION_FOLDER = "test/regression";

// Imperative verbs an action item may start with. "Be" and "Try" are left out on purpose:
// "Be more careful" is a wish, not an action.
const ACTION_VERBS = new Set(
  (
    "add alert agree audit automate block build cap change check confirm cover create dedupe " +
    "define delete document drop enforce escalate extend fix give investigate keep limit link " +
    "log look make measure merge monitor move notify page publish put raise record reject " +
    "remove rename replace require retry return review rewrite roll run schedule send set " +
    "share ship split stop store teach test track treat turn update validate verify wire write"
  ).split(" "),
);
const ROLE_WORDS =
  /\b(lead|engineer|engineering|manager|qa|pm|owner|on-call|product|release|operations|team)\b/i;

export const postmortemOf = (folder: string) => readFile(folder, POSTMORTEM);

function incidentLog(name: string): string {
  return readFile(INCIDENT_LOGS, name);
}

// Every HH:MM time that appears in incident.log, deploys.log, chat.txt and availability.csv.
export function timesInTheLogs(): Set<string> {
  const isoTimes = `${incidentLog("incident.log")}\n${incidentLog("deploys.log")}`;
  const fromIso = [...isoTimes.matchAll(/T(\d\d:\d\d):\d\d/g)].map((match) => match[1]);
  const fromChat = [...incidentLog("chat.txt").matchAll(/^(\d\d:\d\d) /gm)].map(
    (match) => match[1],
  );
  const readings = incidentLog("availability.csv");
  const fromReadings = [...readings.matchAll(/T(\d\d:\d\d):\d\dZ,/g)].map((match) => match[1]);
  return new Set([...fromIso, ...fromChat, ...fromReadings]);
}

type Reading = { minute: number; percent: number };

function availabilityReadings(): Reading[] {
  const rows = incidentLog("availability.csv").trim().split("\n").slice(1);
  return rows.map((row) => {
    const [checkedAt, percent] = row.split(",");
    return { minute: Date.parse(checkedAt) / 60000, percent: Number(percent) };
  });
}

export type IncidentNumbers = {
  bikes: number;
  minutes: number;
  availabilityBefore: number;
  availabilityLowest: number;
};

// The check's own count, from the raw logs. For example: 212 bikes, 190 minutes, 97.8 to 89.0.
export function incidentNumbers(): IncidentNumbers {
  const bikes = Number(incidentLog("incident.log").match(/re-enables (\d+) bikes/)?.[1] ?? 0);
  const readings = availabilityReadings();
  const before = readings[0].percent;
  const startIndex = readings.findIndex((reading) => reading.percent < before);
  const afterStart = readings.slice(startIndex);
  const end = afterStart.find((reading) => reading.percent >= before) ?? readings.at(-1);
  const minutes = (end?.minute ?? 0) - readings[startIndex].minute;
  const lowest = Math.min(...readings.map((reading) => reading.percent));
  return { bikes, minutes, availabilityBefore: before, availabilityLowest: lowest };
}

function mentionsDuration(text: string, minutes: number): boolean {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hoursAndMinutes = new RegExp(
    `\\b${hours}\\s*(hours?|h)[\\s,and]*${rest}\\s*(minutes?|mins?|m)\\b`,
    "i",
  );
  const onlyMinutes = new RegExp(`\\b${minutes}\\s*(minutes|mins?)\\b`, "i");
  return hoursAndMinutes.test(text) || onlyMinutes.test(text);
}

function mentionsPercent(text: string, percent: number): boolean {
  const written = percent.toFixed(1).replace(/\.0$/, "(\\.0)?").replace(".", "\\.");
  return new RegExp(`\\b${written}(?!\\d)`).test(text);
}

const impactOf = (folder: string) => sectionOf(postmortemOf(folder), "Impact");

function rosterNames(): string[] {
  const rows = readFile(BASE_WORLD, "data/roster.csv").trim().split("\n").slice(1);
  const fullNames = rows.map((row) => row.split(",")[0]);
  return fullNames.flatMap((fullName) => [fullName, ...fullName.split(" ")]);
}

// A name from the roster, as a whole word. For example "Sam Achebe" or "Sam".
export function namesPerson(text: string): boolean {
  return rosterNames().some((name) => new RegExp(`\\b${name}\\b`).test(text));
}

function headingsInOrder(folder: string): boolean {
  const headings = headingsOf(postmortemOf(folder)).map((heading) => heading.toLowerCase());
  const positions = HEADINGS.map((heading) => headings.indexOf(heading.toLowerCase()));
  const allThere = positions.every((position) => position >= 0);
  const inOrder = positions.every(
    (position, index) => index === 0 || position > positions[index - 1],
  );
  return allThere && inOrder;
}

function timelineTimesAreReal(folder: string): boolean {
  const timeline = sectionOf(postmortemOf(folder), "Timeline");
  const times = [...timeline.matchAll(/\b(\d\d:\d\d)\b/g)].map((match) => match[1]);
  const logTimes = timesInTheLogs();
  return times.length >= 4 && times.every((time) => logTimes.has(time));
}

type ActionItem = { action: string; owner: string; check: string };

const tableCells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

function columnOf(header: string[], pattern: RegExp): number {
  return header.findIndex((cell) => pattern.test(cell));
}

// Action items written as a table: | ID | Action | Owner | Check |
function itemsFromTable(tableLines: string[]): ActionItem[] {
  const header = tableCells(tableLines[0]);
  let actionColumn = columnOf(header, /^(action|what)/i);
  if (actionColumn < 0) actionColumn = header.findIndex((cell) => !/^(id|#)?$/i.test(cell));
  const ownerColumn = columnOf(header, /owner/i);
  const checkColumn = columnOf(header, /check/i);
  return tableLines.slice(2).map((line) => {
    const cells = tableCells(line);
    return {
      action: cells[actionColumn] ?? "",
      owner: ownerColumn < 0 ? "" : (cells[ownerColumn] ?? ""),
      check: checkColumn < 0 ? "" : (cells[checkColumn] ?? ""),
    };
  });
}

// Action items written as a list: - **A-1** Add a test. Owner: tech lead. Check: `bun test`.
function itemFromBullet(line: string): ActionItem {
  const text = line.replace(/^\s*(-|\*|\d+\.)\s+/, "");
  const owner = text.match(/Owner:\s*([^.]*)/i)?.[1] ?? "";
  const check = text.match(/Check:\s*(.*)$/i)?.[1] ?? "";
  const action = text.split(/Owner:/i)[0];
  return { action, owner, check };
}

export function actionItemsOf(folder: string): ActionItem[] {
  const lines = sectionOf(postmortemOf(folder), "Action items").split("\n");
  const tableLines = lines.filter((line) => line.trim().startsWith("|"));
  if (tableLines.length >= 3) return itemsFromTable(tableLines);
  const bullets = lines.filter((line) => /^\s*(-|\*|\d+\.)\s+/.test(line));
  return bullets.map(itemFromBullet);
}

function firstWordOf(action: string): string {
  const plain = action.replaceAll("*", "").replaceAll("`", "").trim();
  const withoutId = plain.replace(/^A-?\d+[:.]?\s*/i, "");
  return (withoutId.match(/[A-Za-z]+/)?.[0] ?? "").toLowerCase();
}

function actionItemIsGood(item: ActionItem): boolean {
  const startsWithVerb = ACTION_VERBS.has(firstWordOf(item.action));
  const ownerIsRole = ROLE_WORDS.test(item.owner) && !namesPerson(item.owner);
  const hasCheck = /`[^`]+`/.test(item.check);
  return startsWithVerb && ownerIsRole && hasCheck;
}

function actionItemsAreGood(folder: string): boolean {
  const items = actionItemsOf(folder);
  return items.length >= 2 && items.every(actionItemIsGood);
}

function regressionTests(folder: string): string[] {
  const testFolder = join(folder, REGRESSION_FOLDER);
  if (!existsSync(testFolder)) return [];
  return readdirSync(testFolder).filter((name) => name.endsWith(".test.ts"));
}

type TestRun = { exitCode: number; passing: number };

function runTests(folder: string, path: string): TestRun {
  const result = Bun.spawnSync(["bun", "test", path], { cwd: folder, timeout: 180_000 });
  const output = `${result.stdout}\n${result.stderr}`;
  const passing = Number(output.match(/^\s*(\d+) pass/m)?.[1] ?? 0);
  return { exitCode: result.exitCode ?? 1, passing };
}

// The incident build is the code as it was when this step began, shipped with the course.
// The learner's regression tests are copied into it, and at least one must fail there.
function regressionFailsOnTheIncidentBuild(folder: string): boolean {
  if (regressionTests(folder).length === 0) return false;
  const incidentBuild = buildSnapshot(INCIDENT_BUILD);
  const target = join(incidentBuild, REGRESSION_FOLDER);
  cpSync(join(folder, REGRESSION_FOLDER), target, { recursive: true });
  return runTests(incidentBuild, REGRESSION_FOLDER).exitCode !== 0;
}

function everyTestPassesOnTheFix(folder: string): boolean {
  if (regressionTests(folder).length === 0) return false;
  const regression = runTests(folder, REGRESSION_FOLDER);
  if (regression.exitCode !== 0 || regression.passing === 0) return false;
  return runTests(folder, "").exitCode === 0;
}

export default [
  {
    says: `${POSTMORTEM} has the six sections in order, from Summary to Action items`,
    test: headingsInOrder,
    tryNext: "ask Claude Code to use exactly these six ## headings, in this order",
  },
  {
    says: "every time in the Timeline appears in the incident logs, and there are at least 4",
    test: timelineTimesAreReal,
    tryNext:
      "ask Claude Code to use only HH:MM times copied from incident.log, deploys.log or chat.txt",
  },
  {
    says: "Impact gives the number of bikes the check counts in incident.log",
    test: (folder) => new RegExp(`\\b${incidentNumbers().bikes}\\b`).test(impactOf(folder)),
    tryNext:
      "ask Claude Code to count the bikes from the line in incident.log that re-enables them",
  },
  {
    says: "Impact gives how long North availability was down, as the check counts it",
    test: (folder) => mentionsDuration(impactOf(folder), incidentNumbers().minutes),
    tryNext:
      "ask Claude Code to work out the length from availability.csv, like 3 hours 10 minutes",
  },
  {
    says: "Impact gives North availability before the incident and at its lowest",
    test: (folder) => {
      const numbers = incidentNumbers();
      const impact = impactOf(folder);
      const before = mentionsPercent(impact, numbers.availabilityBefore);
      return before && mentionsPercent(impact, numbers.availabilityLowest);
    },
    tryNext: "ask Claude Code to read the first and the lowest value in availability.csv",
  },
  {
    says: "Contributing factors name no person from data/roster.csv",
    test: (folder) => {
      const factors = sectionOf(postmortemOf(folder), "Contributing factors");
      return factors !== "" && !namesPerson(factors);
    },
    tryNext:
      "ask Claude Code to name the system or the missing check behind each factor, never a person",
  },
  {
    says: "each action item starts with a verb, names an owner role and a check in backticks",
    test: actionItemsAreGood,
    tryNext:
      "ask Claude Code to give every action item an Owner (a role) and a Check (a command or file)",
  },
  {
    says: "a regression test in test/regression/ fails on the incident build",
    test: regressionFailsOnTheIncidentBuild,
    tryNext:
      "ask Claude Code for a test that sends one wrench three times, and to show it fails first",
  },
  {
    says: "the regression test and every other test pass on your fix",
    test: everyTestPassesOnTheFix,
    tryNext: "run bun test in kestrel/ and ask Claude Code to fix src/ until it is green",
  },
  {
    says: "the acceptance tests are unchanged since QA approved them",
    test: (folder) => approvalHolds(folder, "test/acceptance", "qa"),
    tryNext: "in kestrel/, run git checkout test/acceptance and fix the code instead",
  },
  {
    says: "the tech lead approved work/postmortem.md as it is now",
    test: (folder) => approvalHolds(folder, POSTMORTEM, "tech-lead"),
    tryNext: "read the postmortem, then run bun run approve work/postmortem.md --role tech-lead",
  },
] satisfies Rule[];
