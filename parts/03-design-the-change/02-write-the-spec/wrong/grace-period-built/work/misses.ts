// Counts where Kestrel misses the 48 hour repair limit (SLA-4).
// Usage: bun work/misses.ts <question>
// Questions: miss-rate, north-ebike-battery, re-rent, credits, by-depot, all

import { readFileSync } from "node:fs";

// Values copied from data/contract/sla.yaml (SLA-4).
const LIMIT_HOURS = 48;
const CREDIT_PER_LATE_BIKE_POUNDS = 50;

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

type Row = Record<string, string>;

type Repair = {
  wrench: Row;
  repair: Row;
  station: Row;
};

// Reads a CSV file into rows keyed by column name.
// The data has no commas inside fields, so a plain split is enough.
function readCsv(path: string): Row[] {
  const text = readFileSync(path, "utf8");
  const lines = text.trim().split("\n");
  const columns = lines[0].split(",");
  const dataLines = lines.slice(1);
  return dataLines.map((line) => toRow(columns, line.split(",")));
}

function toRow(columns: string[], values: string[]): Row {
  const row: Row = {};
  columns.forEach((column, index) => {
    row[column] = values[index];
  });
  return row;
}

function indexBy(rows: Row[], column: string): Map<string, Row> {
  const index = new Map<string, Row>();
  for (const row of rows) {
    index.set(row[column], row);
  }
  return index;
}

// Joins each wrench with its repair job and its station.
function loadRepairs(): Repair[] {
  const wrenches = readCsv("data/wrenches.csv");
  const repairsByWrench = indexBy(readCsv("data/repairs.csv"), "wrench_id");
  const stationsById = indexBy(readCsv("data/stations.csv"), "station_id");
  return wrenches.map((wrench) => ({
    wrench: wrench,
    repair: mustFind(repairsByWrench, wrench.wrench_id),
    station: mustFind(stationsById, wrench.station_id),
  }));
}

function mustFind(index: Map<string, Row>, key: string): Row {
  const row = index.get(key);
  if (row === undefined) {
    throw new Error(`No row found for ${key}`);
  }
  return row;
}

function hoursBetween(startText: string, endText: string): number {
  const start = Date.parse(startText);
  const end = Date.parse(endText);
  return (end - start) / MILLISECONDS_PER_HOUR;
}

// The SLA-4 clock starts at the wrench (reported_at), not at opened_at.
function isLate(item: Repair): boolean {
  const hours = hoursBetween(item.wrench.reported_at, item.repair.closed_at);
  return hours > LIMIT_HOURS;
}

function isNorthEbikeBattery(item: Repair): boolean {
  const isEbike = item.wrench.bike_type === "ebike";
  const isBattery = item.wrench.fault === "BATT";
  const isNorth = item.station.depot === "North";
  return isEbike && isBattery && isNorth;
}

// A re-rent means a rider took the bike out before the crew reached it.
function wasRentedBeforeCrew(item: Repair): boolean {
  const rentedAgain = item.wrench.rented_again_at;
  if (rentedAgain === "") {
    return false;
  }
  return Date.parse(rentedAgain) < Date.parse(item.repair.reached_at);
}

function percent(part: number, whole: number): string {
  const share = (part / whole) * 100;
  return `${share.toFixed(1)}%`;
}

function report(label: string, part: number, whole: number): void {
  console.log(`${label}: ${part} of ${whole} = ${percent(part, whole)}`);
}

function showMissRate(repairs: Repair[]): void {
  const late = repairs.filter(isLate);
  report("Late bikes (closed > 48h after wrench)", late.length, repairs.length);
}

function showNorthEbikeBattery(repairs: Repair[]): void {
  const late = repairs.filter(isLate);
  const northBattery = late.filter(isNorthEbikeBattery);
  report("Late bikes that are North-depot e-bikes with BATT", northBattery.length, late.length);
}

function showReRent(repairs: Repair[]): void {
  const reRented = repairs.filter(wasRentedBeforeCrew);
  report("Wrenched bikes rented again before crew arrived", reRented.length, repairs.length);
}

function showCredits(repairs: Repair[]): void {
  const late = repairs.filter(isLate);
  const rate = CREDIT_PER_LATE_BIKE_POUNDS;
  const credits = late.length * rate;
  console.log(`Credits: ${late.length} late bikes x £${rate} = £${credits}`);
}

// Extra context: late bikes split by depot, with and without the North battery group.
function showByDepot(repairs: Repair[]): void {
  for (const depot of ["North", "South"]) {
    const inDepot = repairs.filter((item) => item.station.depot === depot);
    const late = inDepot.filter(isLate);
    report(`${depot} late`, late.length, inDepot.length);
  }
  const others = repairs.filter((item) => !isNorthEbikeBattery(item));
  const lateOthers = others.filter(isLate);
  report("Late, excluding North e-bike BATT", lateOthers.length, others.length);
  const northBattery = repairs.filter(isNorthEbikeBattery);
  const lateNorthBattery = northBattery.filter(isLate);
  report("Late, North e-bike BATT only", lateNorthBattery.length, northBattery.length);
}

const questions: Record<string, (repairs: Repair[]) => void> = {
  "miss-rate": showMissRate,
  "north-ebike-battery": showNorthEbikeBattery,
  "re-rent": showReRent,
  credits: showCredits,
  "by-depot": showByDepot,
};

function main(): void {
  const question = process.argv[2] ?? "all";
  const repairs = loadRepairs();
  if (question === "all") {
    for (const show of Object.values(questions)) show(repairs);
    return;
  }
  const show = questions[question];
  if (show === undefined) {
    throw new Error(`Unknown question: ${question}`);
  }
  show(repairs);
}

main();
