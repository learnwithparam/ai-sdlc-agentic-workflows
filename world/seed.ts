// bun world/seed.ts: writes Kestrel's data files from a fixed seed.
//
// The same seed always gives the same rows, so every check can recompute every number.
// Run it only when the world itself changes, then commit the files it writes.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_FOLDER = join(import.meta.dir, "kestrel", "data");
const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const FIRST_DAY_OF_DATA = Date.parse("2026-07-01T00:00:00Z");
const DAYS_OF_DATA = 90;
const WRENCHES_PER_DAY = 24;

// A small random number generator with a seed (mulberry32), so the data never changes by accident.
function makeRandom(seed: number) {
  let state = seed;
  return function nextRandom(): number {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const random = makeRandom(20261113);

function between(low: number, high: number): number {
  return low + random() * (high - low);
}

function pickOne<Item>(items: Item[]): Item {
  return items[Math.floor(random() * items.length)];
}

function pickWeighted(weights: Record<string, number>): string {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;
  for (const [choice, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return choice;
  }
  return Object.keys(weights)[0];
}

function isoTime(time: number): string {
  const wholeSeconds = Math.round(time / 1000) * 1000;
  return new Date(wholeSeconds).toISOString().replace(".000Z", "Z");
}

function writeCsv(fileName: string, header: string[], rows: (string | number)[][]) {
  const lines = [header.join(","), ...rows.map((row) => row.join(","))];
  writeFileSync(join(DATA_FOLDER, fileName), `${lines.join("\n")}\n`);
}

type Station = { id: string; name: string; district: string; depot: string };

const DISTRICTS = [
  { name: "North", depot: "North", stations: 40 },
  { name: "East", depot: "North", stations: 30 },
  { name: "Centre", depot: "South", stations: 40 },
  { name: "South", depot: "South", stations: 35 },
  { name: "West", depot: "South", stations: 35 },
];

const STREET_WORDS = [
  "Mill",
  "Quay",
  "Abbey",
  "Orchard",
  "Market",
  "Canal",
  "Station",
  "Bridge",
  "Chapel",
  "Foundry",
  "Harbour",
  "Meadow",
  "Rope",
  "Tannery",
  "Weaver",
  "Willow",
  "Castle",
  "Granary",
];
const STREET_ENDINGS = ["Street", "Lane", "Road", "Square", "Yard", "Row", "Gate", "Walk", "Hill"];

function makeStations(): Station[] {
  const names = STREET_WORDS.flatMap((word) => STREET_ENDINGS.map((ending) => `${word} ${ending}`));
  const stations: Station[] = [];
  for (const district of DISTRICTS) {
    for (let i = 0; i < district.stations; i++) {
      const id = `S-${String(stations.length + 1).padStart(3, "0")}`;
      const name = names.splice(Math.floor(random() * names.length), 1)[0];
      stations.push({ id, name, district: district.name, depot: district.depot });
    }
  }
  return stations;
}

function writeStations(stations: Station[]) {
  const rows = stations.map((station, index) => {
    const column = index % 15;
    const row = Math.floor(index / 15);
    const mapLeft = column * 60 + 40 + Math.round(between(-12, 12));
    const mapTop = row * 50 + 40 + Math.round(between(-10, 10));
    return [station.id, station.name, station.district, station.depot, mapLeft, mapTop, 20];
  });
  writeCsv("stations.csv", ["station_id", "name", "district", "depot", "x", "y", "docks"], rows);
}

type Bike = { id: string; type: string; homeStation: string };

function makeBikes(stations: Station[]): Bike[] {
  const bikes: Bike[] = [];
  for (let number = 1000; number < 3100; number++) {
    const type = number % 3 === 0 ? "ebike" : "classic";
    bikes.push({ id: `B-${number}`, type, homeStation: pickOne(stations).id });
  }
  return bikes;
}

function writeBikes(bikes: Bike[]) {
  const rows = bikes.map((bike) => [bike.id, bike.type, bike.homeStation]);
  writeCsv("bikes.csv", ["bike_id", "bike_type", "station_id"], rows);
}

const EBIKE_FAULTS = { BATT: 40, BRAKE: 15, TYRE: 15, CHAIN: 5, LOCK: 15, OTHER: 10 };
const CLASSIC_FAULTS = { BRAKE: 30, TYRE: 30, CHAIN: 20, LOCK: 15, OTHER: 5 };
const CREWS: Record<string, string[]> = { North: ["N1", "N2"], South: ["S1", "S2"] };

// The planted truth: battery faults on e-bikes in the North depot's area are the ones that slip.
// The bike still looks fine to the next rider, and the North crews work the queue oldest first.
function isHardCase(bike: Bike, fault: string, station: Station): boolean {
  return bike.type === "ebike" && fault === "BATT" && station.depot === "North";
}

type Wrench = {
  id: string;
  bike: Bike;
  station: Station;
  reportedAt: number;
  fault: string;
  rentedAgainAt: number | undefined;
  reachedAt: number;
};

function makeWrench(number: number, bikes: Bike[], stations: Station[]): Wrench {
  const bike = pickOne(bikes);
  const station = pickOne(stations);
  const fault = pickWeighted(bike.type === "ebike" ? EBIKE_FAULTS : CLASSIC_FAULTS);
  const day = Math.floor(number / WRENCHES_PER_DAY);
  const reportedAt = FIRST_DAY_OF_DATA + day * 24 * HOUR + Math.round(between(6, 22) * HOUR);
  const hard = isHardCase(bike, fault, station);
  const missesTheLimit = random() < (hard ? 0.65 : 0.03);
  const hoursToReach = missesTheLimit ? between(49, 80) : between(2, 40);
  const reachedAt = reportedAt + Math.round(hoursToReach * HOUR);
  const rentedAgain = random() < (hard ? 0.5 : 0.07);
  const rentedAgainAt = rentedAgain
    ? Math.round(between(reportedAt + 10 * MINUTE, reachedAt - 10 * MINUTE))
    : undefined;
  const id = `W-${String(number + 1).padStart(5, "0")}`;
  return { id, bike, station, reportedAt, fault, rentedAgainAt, reachedAt };
}

function writeWrenchesAndRepairs(bikes: Bike[], stations: Station[]) {
  const wrenchRows: (string | number)[][] = [];
  const repairRows: (string | number)[][] = [];
  for (let number = 0; number < DAYS_OF_DATA * WRENCHES_PER_DAY; number++) {
    const wrench = makeWrench(number, bikes, stations);
    const rentedAgain = wrench.rentedAgainAt ? isoTime(wrench.rentedAgainAt) : "";
    wrenchRows.push([
      wrench.id,
      wrench.bike.id,
      wrench.bike.type,
      wrench.station.id,
      isoTime(wrench.reportedAt),
      wrench.fault,
      rentedAgain,
    ]);
    repairRows.push(repairRowFor(wrench, number));
  }
  const wrenchHeader = ["wrench_id", "bike_id", "bike_type", "station_id", "reported_at"];
  writeCsv("wrenches.csv", [...wrenchHeader, "fault", "rented_again_at"], wrenchRows);
  const repairHeader = ["job_id", "wrench_id", "bike_id", "depot", "crew", "opened_at"];
  writeCsv("repairs.csv", [...repairHeader, "reached_at", "closed_at", "outcome"], repairRows);
}

function repairRowFor(wrench: Wrench, number: number): (string | number)[] {
  const openedAt = wrench.reportedAt + Math.round(between(5, 90) * MINUTE);
  const closedAt = wrench.reachedAt + Math.round(between(0.5, 3) * HOUR);
  const outcome = pickWeighted({ fixed: 80, "part replaced": 15, "no fault found": 5 });
  return [
    `J-${String(number + 1).padStart(5, "0")}`,
    wrench.id,
    wrench.bike.id,
    wrench.station.depot,
    pickOne(CREWS[wrench.station.depot]),
    isoTime(openedAt),
    isoTime(wrench.reachedAt),
    isoTime(closedAt),
    outcome,
  ];
}

// Jobs still open when spoke starts. Times are hours before start, so the queue is always fresh.
// Inspection jobs get 96 hours and wrench jobs 48, so "oldest first" and "due first" disagree.
function writeOpenJobs(bikes: Bike[], stations: Station[]) {
  const rows: (string | number)[][] = [];
  for (let number = 1; number <= 40; number++) {
    const station = pickOne(stations);
    const source = number % 3 === 0 ? "wrench" : "inspection";
    const reportedHoursAgo = Math.round(between(1, source === "wrench" ? 40 : 80) * 10) / 10;
    const openedHoursAgo = Math.round((reportedHoursAgo - between(0.1, 1)) * 10) / 10;
    const bike = pickOne(bikes);
    const fault = pickWeighted(bike.type === "ebike" ? EBIKE_FAULTS : CLASSIC_FAULTS);
    const id = `J-OPEN-${String(number).padStart(2, "0")}`;
    rows.push([id, bike.id, station.id, station.depot, source, fault, reportedHoursAgo]);
    rows[rows.length - 1].push(Math.max(0, openedHoursAgo));
  }
  const header = ["job_id", "bike_id", "station_id", "depot", "source", "fault"];
  writeCsv("open-jobs.csv", [...header, "reported_hours_ago", "opened_hours_ago"], rows);
}

const FIRST_DEPLOY_DAY = Date.parse("2026-05-01T00:00:00Z");
const DAYS_OF_DEPLOYS = 184;

// Six months of spoke deploys and the incidents some of them caused: the input for the DORA keys.
function writeDeploysAndIncidents() {
  const deployRows: (string | number)[][] = [];
  const incidentRows: (string | number)[][] = [];
  for (let day = 0; day < DAYS_OF_DEPLOYS; day++) {
    if (random() > 0.4) continue;
    const deployedAt = FIRST_DEPLOY_DAY + day * 24 * HOUR + Math.round(between(9, 17) * HOUR);
    const committedAt = deployedAt - Math.round(between(4, 120) * HOUR);
    const deployId = `D-${String(deployRows.length + 1).padStart(3, "0")}`;
    let incidentId = "";
    if (random() < 0.12) {
      incidentId = `INC-${String(incidentRows.length + 1).padStart(2, "0")}`;
      const startedAt = deployedAt + Math.round(between(0.2, 6) * HOUR);
      const resolvedAt = startedAt + Math.round(between(0.5, 5) * HOUR);
      const summary = pickOne(INCIDENT_SUMMARIES);
      incidentRows.push([incidentId, deployId, isoTime(startedAt), isoTime(resolvedAt), summary]);
    }
    const commit = Math.floor(random() * 0xfffffff)
      .toString(16)
      .padStart(7, "0");
    deployRows.push([
      deployId,
      "spoke",
      commit,
      isoTime(committedAt),
      isoTime(deployedAt),
      incidentId,
    ]);
  }
  const deployHeader = ["deploy_id", "service", "commit", "committed_at", "deployed_at"];
  writeCsv("deploys.csv", [...deployHeader, "incident_id"], deployRows);
  const incidentHeader = ["incident_id", "deploy_id", "started_at", "resolved_at", "summary"];
  writeCsv("incidents.csv", incidentHeader, incidentRows);
}

const INCIDENT_SUMMARIES = [
  "feed served stale station counts",
  "crew queue page timed out",
  "docks shown free while full",
  "e-bike battery levels missing from feed",
];

if (import.meta.main) {
  mkdirSync(join(DATA_FOLDER, "contract"), { recursive: true });
  const stations = makeStations();
  const bikes = makeBikes(stations);
  writeStations(stations);
  writeBikes(bikes);
  writeWrenchesAndRepairs(bikes, stations);
  writeOpenJobs(bikes, stations);
  writeDeploysAndIncidents();
  console.log(`Wrote Kestrel's data to ${DATA_FOLDER}`);
}
