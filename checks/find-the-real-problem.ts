// find-the-real-problem: work/findings.md reports where the 48 hour misses happen.
// The check counts every number again from data/, so a guess or a made-up number fails.

import { join } from "node:path";
import { fileExists, readFile } from "./lib/files";
import type { Rule } from "./lib/rule";

const FINDINGS = "work/findings.md";
const PERCENT_TOLERANCE = 0.5;
const POUNDS_TOLERANCE = 50;
const HOUR = 60 * 60 * 1000;

type Row = Record<string, string>;

// The data files hold no commas inside a field, so a plain split is enough.
function readCsv(folder: string, file: string): Row[] {
  const lines = readFile(folder, join("data", file)).trim().split("\n");
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Row = {};
    header.forEach((column, index) => {
      row[column] = values[index] ?? "";
    });
    return row;
  });
}

function contractNumber(folder: string, field: string): number {
  const contract = readFile(folder, "data/contract/sla.yaml");
  const match = contract.match(new RegExp(`${field}:\\s*(\\d+)`));
  return Number(match?.[1] ?? 0);
}

export type TrueNumbers = {
  missRate: number;
  northBatteryShare: number;
  reRentRate: number;
  creditPounds: number;
};

function lateWrenches(folder: string): Row[] {
  const limitHours = contractNumber(folder, "wrenched_limit_hours");
  const repairs = readCsv(folder, "repairs.csv");
  const closedAt = new Map(repairs.map((repair) => [repair.wrench_id, repair.closed_at]));
  return readCsv(folder, "wrenches.csv").filter((wrench) => {
    const closed = Date.parse(closedAt.get(wrench.wrench_id) ?? "");
    return closed - Date.parse(wrench.reported_at) > limitHours * HOUR;
  });
}

// The answer the check expects, counted from the same files Claude Code read.
export function trueNumbers(folder: string): TrueNumbers {
  const wrenches = readCsv(folder, "wrenches.csv");
  const stations = readCsv(folder, "stations.csv");
  const depotOf = new Map(stations.map((station) => [station.station_id, station.depot]));
  const late = lateWrenches(folder);
  const northBattery = late.filter(
    (wrench) =>
      wrench.bike_type === "ebike" &&
      wrench.fault === "BATT" &&
      depotOf.get(wrench.station_id) === "North",
  );
  const rentedAgain = wrenches.filter((wrench) => wrench.rented_again_at !== "");
  return {
    missRate: (100 * late.length) / wrenches.length,
    northBatteryShare: (100 * northBattery.length) / late.length,
    reRentRate: (100 * rentedAgain.length) / wrenches.length,
    creditPounds: late.length * contractNumber(folder, "credit_per_late_bike_gbp"),
  };
}

// A line counts as evidence when it shows the command beside the number, in backticks.
function showsCommand(line: string): boolean {
  return /`[a-z][\w./-]* [^`]+`/.test(line);
}

function percentagesOn(line: string): number[] {
  const matches = [...line.matchAll(/(\d+(?:\.\d+)?)\s*%/g)];
  return matches.map((match) => Number(match[1]));
}

function poundsOn(line: string): number[] {
  const signFirst = [...line.matchAll(/£\s?([\d,]+)/g)];
  const wordAfter = [...line.matchAll(/([\d,]+)\s*(?:pounds|GBP)/gi)];
  const amounts = [...signFirst, ...wordAfter].map((match) => match[1].replaceAll(",", ""));
  return amounts.map(Number);
}

function findingLines(folder: string): string[] {
  return readFile(folder, FINDINGS).split("\n");
}

// True when one line of findings.md has the number, close enough, and the command that made it.
function reportsWithCommand(
  folder: string,
  numbersOn: (line: string) => number[],
  expected: number,
  tolerance: number,
): boolean {
  return findingLines(folder).some((line) => {
    const close = numbersOn(line).some((number) => Math.abs(number - expected) <= tolerance);
    return close && showsCommand(line);
  });
}

function percentRule(name: keyof TrueNumbers, says: string, tryNext: string): Rule {
  return {
    says: `findings.md gives ${says}, with its command`,
    test: (folder) => {
      const expected = trueNumbers(folder)[name];
      return reportsWithCommand(folder, percentagesOn, expected, PERCENT_TOLERANCE);
    },
    tryNext,
  };
}

export default [
  {
    says: "work/findings.md exists",
    test: (folder) => fileExists(folder, FINDINGS),
    tryNext: "ask Claude Code to write its findings to work/findings.md",
  },
  percentRule(
    "missRate",
    "the miss rate",
    "ask Claude Code to count late bikes from the wrench reported_at, and show the command",
  ),
  percentRule(
    "northBatteryShare",
    "the share of late bikes that are North BATT e-bikes",
    "ask Claude Code to join wrenches.csv to stations.csv and split the late bikes by depot",
  ),
  percentRule(
    "reRentRate",
    "the re-rent rate",
    "ask Claude Code to count the rows of wrenches.csv with a rented_again_at value",
  ),
  {
    says: "findings.md gives the credit cost in pounds, with its command",
    test: (folder) => {
      const expected = trueNumbers(folder).creditPounds;
      return reportsWithCommand(folder, poundsOn, expected, POUNDS_TOLERANCE);
    },
    tryNext: "ask Claude Code to multiply the late bikes by the credit in data/contract/sla.yaml",
  },
] satisfies Rule[];
