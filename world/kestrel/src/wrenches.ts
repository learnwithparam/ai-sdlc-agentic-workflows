// POST /wrench: a rider pressed the wrench button in the app to report a broken bike.
import type { Database } from "bun:sqlite";
import { logEvent } from "./log";

type WrenchReport = { bike_id?: string; fault?: string };
type BikeRow = { bike_id: string; station_id: string };
type StationRow = { depot: string };

export function recordWrench(database: Database, report: WrenchReport) {
  const bike = database.query("SELECT * FROM bikes WHERE bike_id = ?").get(report.bike_id ?? "");
  if (!bike) return { status: 404, body: { error: `no bike called ${report.bike_id}` } };
  const { bike_id, station_id } = bike as BikeRow;
  const station = database.query("SELECT depot FROM stations WHERE station_id = ?").get(station_id);
  const reportedAt = new Date().toISOString();
  const fault = report.fault ?? "OTHER";

  database
    .query("INSERT INTO wrenches (bike_id, station_id, fault, reported_at) VALUES (?, ?, ?, ?)")
    .run(bike_id, station_id, fault, reportedAt);

  // A dispatcher opens the repair job from the wrench.
  const jobId = `J-${Date.now()}`;
  const depot = (station as StationRow).depot;
  database
    .query("INSERT INTO repair_jobs VALUES (?, ?, ?, ?, 'wrench', ?, ?, ?, NULL)")
    .run(jobId, bike_id, station_id, depot, fault, reportedAt, reportedAt);

  logEvent("wrench", { bike_id, station_id, fault, job_id: jobId });
  return { status: 201, body: { job_id: jobId, bike_id } };
}
