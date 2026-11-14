// POST /wrench: a rider pressed the wrench button in the app to report a broken bike.
// SLA-12: the bike leaves service at once, so the feed never shows a reported bike as rentable.
import type { Database } from "bun:sqlite";
import { logEvent } from "./log";

type WrenchReport = { bike_id?: string; fault?: string; request_id?: string };
type BikeRow = { bike_id: string; station_id: string };
type StationRow = { depot: string };

export function recordWrench(database: Database, report: WrenchReport) {
  // Unknown bikes are turned away before any write.
  const bike = database.query("SELECT * FROM bikes WHERE bike_id = ?").get(report.bike_id ?? "");
  if (!bike) return { status: 404, body: { error: `no bike called ${report.bike_id}` } };
  const { bike_id, station_id } = bike as BikeRow;
  const station = database.query("SELECT depot FROM stations WHERE station_id = ?").get(station_id);
  const depot = (station as StationRow).depot;
  const reportedAt = new Date().toISOString();
  const fault = report.fault ?? "OTHER";
  const requestId =
    typeof report.request_id === "string" && report.request_id !== "" ? report.request_id : null;

  // The wrench, its repair job and the disabled flag are kept together or not at all.
  const record = database.transaction(() => {
    // A retry carries the same request_id, so it is the same report: hand back its job and
    // write nothing. The first wrench's reported_at stays, since SLA-4's clock starts there.
    if (requestId) {
      const earlier = database
        .query("SELECT wrench_id FROM wrenches WHERE request_id = ?")
        .get(requestId) as { wrench_id: number } | null;
      if (earlier) return { jobId: `J-W-${earlier.wrench_id}`, isRepeat: true };
    }
    const wrench = database
      .query(
        "INSERT INTO wrenches (bike_id, station_id, fault, reported_at, request_id) VALUES (?, ?, ?, ?, ?)",
      )
      .run(bike_id, station_id, fault, reportedAt, requestId);
    // The wrench row id makes the job id unique, even for two wrenches in the same millisecond.
    const jobId = `J-W-${wrench.lastInsertRowid}`;
    database
      .query("INSERT INTO repair_jobs VALUES (?, ?, ?, ?, 'wrench', ?, ?, ?, NULL)")
      .run(jobId, bike_id, station_id, depot, fault, reportedAt, reportedAt);
    database.query("UPDATE bikes SET is_disabled = 1 WHERE bike_id = ?").run(bike_id);
    return { jobId, isRepeat: false };
  });
  const { jobId, isRepeat } = record();

  if (isRepeat) {
    logEvent("wrench_repeat", { bike_id, request_id: requestId, job_id: jobId });
    return { status: 200, body: { job_id: jobId, bike_id } };
  }
  logEvent("wrench", { bike_id, station_id, fault, job_id: jobId, request_id: requestId });
  return { status: 201, body: { job_id: jobId, bike_id } };
}
