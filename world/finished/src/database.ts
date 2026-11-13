// spoke's database: stations, bikes, wrenches and repair jobs, in one SQLite file.
// When the file is new, it is filled from the CSV files in data/.
import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readCsv } from "./csv";

const DATA_FOLDER = join(import.meta.dir, "..", "data");
const DATABASE_FILE = process.env.SPOKE_DB ?? join(import.meta.dir, "..", "spoke.db");
const HOUR = 60 * 60 * 1000;

const TABLES = `
  CREATE TABLE stations (station_id TEXT PRIMARY KEY, name TEXT, district TEXT, depot TEXT,
    x INTEGER, y INTEGER, docks INTEGER);
  CREATE TABLE bikes (bike_id TEXT PRIMARY KEY, bike_type TEXT, station_id TEXT,
    is_disabled INTEGER DEFAULT 0);
  CREATE TABLE wrenches (wrench_id INTEGER PRIMARY KEY AUTOINCREMENT, bike_id TEXT,
    station_id TEXT, fault TEXT, reported_at TEXT, request_id TEXT, job_id TEXT);
  CREATE TABLE repair_jobs (job_id TEXT PRIMARY KEY, bike_id TEXT, station_id TEXT, depot TEXT,
    source TEXT, fault TEXT, reported_at TEXT, opened_at TEXT, closed_at TEXT);
`;

function fillStationsAndBikes(database: Database) {
  const addStation = database.prepare("INSERT INTO stations VALUES (?, ?, ?, ?, ?, ?, ?)");
  for (const station of readCsv(join(DATA_FOLDER, "stations.csv"))) {
    const mapPosition = [Number(station.x), Number(station.y)];
    const where = [station.station_id, station.name, station.district, station.depot];
    addStation.run(...where, ...mapPosition, Number(station.docks));
  }
  const addBike = database.prepare("INSERT INTO bikes VALUES (?, ?, ?, 0)");
  for (const bike of readCsv(join(DATA_FOLDER, "bikes.csv"))) {
    addBike.run(bike.bike_id, bike.bike_type, bike.station_id);
  }
}

// Open jobs are stored as "hours ago", so the queue looks fresh whenever spoke starts.
function fillOpenJobs(database: Database) {
  const now = Date.now();
  const addJob = database.prepare("INSERT INTO repair_jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)");
  const disableBike = database.prepare(
    "UPDATE bikes SET is_disabled = 1, station_id = ? WHERE bike_id = ?",
  );
  for (const job of readCsv(join(DATA_FOLDER, "open-jobs.csv"))) {
    const reportedAt = new Date(now - Number(job.reported_hours_ago) * HOUR).toISOString();
    const openedAt = new Date(now - Number(job.opened_hours_ago) * HOUR).toISOString();
    const { job_id, bike_id, station_id, depot, source, fault } = job;
    addJob.run(job_id, bike_id, station_id, depot, source, fault, reportedAt, openedAt);
    disableBike.run(station_id, bike_id);
  }
}

// A database made before request_id existed gets the new columns. A retried wrench report with
// the same request_id is the same report (postmortem A-1), so request_id is unique.
function addRequestIds(database: Database) {
  const columns = database.query("PRAGMA table_info(wrenches)").all() as { name: string }[];
  const names = new Set(columns.map((column) => column.name));
  if (!names.has("request_id")) database.exec("ALTER TABLE wrenches ADD COLUMN request_id TEXT");
  if (!names.has("job_id")) database.exec("ALTER TABLE wrenches ADD COLUMN job_id TEXT");
  database.exec("CREATE UNIQUE INDEX IF NOT EXISTS wrenches_request_id ON wrenches (request_id)");
}

export function openDatabase(): Database {
  const isNew = !existsSync(DATABASE_FILE);
  const database = new Database(DATABASE_FILE);
  if (isNew) {
    database.exec(TABLES);
    fillStationsAndBikes(database);
    fillOpenJobs(database);
  }
  addRequestIds(database);
  return database;
}
