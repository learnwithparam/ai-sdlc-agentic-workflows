// POST /wrench: a rider pressed the wrench button in the app to report a broken bike.
import type { Database } from "bun:sqlite";
import { logEvent } from "./log";

type WrenchReport = { bike_id?: string; fault?: string; request_id?: string };
type BikeRow = { bike_id: string; station_id: string };
type StationRow = { depot: string };

export function recordWrench(database: Database, report: WrenchReport) {
  // The rider app retries a failed POST /wrench with the same request_id. A retry is the same
  // report: answer with the job it already opened and open no new one (postmortem A-1).
  const requestId =
    typeof report.request_id === "string" && report.request_id ? report.request_id : null;
  if (requestId) {
    const earlier = database
      .query("SELECT bike_id, job_id FROM wrenches WHERE request_id = ?")
      .get(requestId) as { bike_id: string; job_id: string } | null;
    if (earlier) return { status: 200, body: { job_id: earlier.job_id, bike_id: earlier.bike_id } };
  }
  const bike = database.query("SELECT * FROM bikes WHERE bike_id = ?").get(report.bike_id ?? "");
  if (!bike) return { status: 404, body: { error: `no bike called ${report.bike_id}` } };
  const { bike_id, station_id } = bike as BikeRow;
  const station = database.query("SELECT depot FROM stations WHERE station_id = ?").get(station_id);
  const reportedAt = new Date().toISOString();
  const fault = report.fault ?? "OTHER";
  const jobId = `J-${Date.now()}`;
  const depot = (station as StationRow).depot;

  // The wrench, its repair job and the disabled bike land together or not at all,
  // so a wrenched bike is never left rentable in the feed (SLA-12).
  database.transaction(() => {
    database
      .query(
        "INSERT INTO wrenches (bike_id, station_id, fault, reported_at, request_id, job_id) " +
          "VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(bike_id, station_id, fault, reportedAt, requestId, jobId);
    // A dispatcher opens the repair job from the wrench.
    database
      .query("INSERT INTO repair_jobs VALUES (?, ?, ?, ?, 'wrench', ?, ?, ?, NULL)")
      .run(jobId, bike_id, station_id, depot, fault, reportedAt, reportedAt);
    database.query("UPDATE bikes SET is_disabled = 1 WHERE bike_id = ?").run(bike_id);
  })();

  logEvent("wrench", { bike_id, station_id, fault, job_id: jobId, request_id: requestId });
  return { status: 201, body: { job_id: jobId, bike_id } };
}
