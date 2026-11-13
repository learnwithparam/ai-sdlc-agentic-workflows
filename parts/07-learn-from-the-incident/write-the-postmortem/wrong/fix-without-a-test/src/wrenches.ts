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
  const jobId = `J-${Date.now()}`;
  const depot = (station as StationRow).depot;

  // A bike that already has an open repair job is already disabled and queued.
  // The rider app retries a failed POST /wrench, so a repeat returns the open job
  // instead of opening a duplicate (postmortem A-2). The check runs inside the
  // transaction so two retries arriving together cannot both open a job.
  const openJob = database
    .transaction(() => {
      const existing = database
        .query("SELECT job_id FROM repair_jobs WHERE bike_id = ? AND closed_at IS NULL LIMIT 1")
        .get(bike_id) as { job_id: string } | null;
      if (existing) return existing.job_id;

      // The wrench, its repair job and the disabled bike land together or not at all,
      // so a wrenched bike is never left rentable in the feed (SLA-12).
      database
        .query("INSERT INTO wrenches (bike_id, station_id, fault, reported_at) VALUES (?, ?, ?, ?)")
        .run(bike_id, station_id, fault, reportedAt);
      // A dispatcher opens the repair job from the wrench.
      database
        .query("INSERT INTO repair_jobs VALUES (?, ?, ?, ?, 'wrench', ?, ?, ?, NULL)")
        .run(jobId, bike_id, station_id, depot, fault, reportedAt, reportedAt);
      database.query("UPDATE bikes SET is_disabled = 1 WHERE bike_id = ?").run(bike_id);
      return null;
    })
    .immediate();

  if (openJob) {
    logEvent("wrench_repeat", { bike_id, station_id, fault, job_id: openJob });
    return { status: 200, body: { job_id: openJob, bike_id } };
  }

  logEvent("wrench", { bike_id, station_id, fault, job_id: jobId });
  return { status: 201, body: { job_id: jobId, bike_id } };
}
