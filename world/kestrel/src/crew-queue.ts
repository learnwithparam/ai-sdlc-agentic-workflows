// GET /crew/queue?depot=North: the open repair jobs a depot's crews work through, top first.
import type { Database } from "bun:sqlite";

const HOUR = 60 * 60 * 1000;

type JobRow = {
  job_id: string;
  bike_id: string;
  station_id: string;
  source: string;
  fault: string;
  reported_at: string;
  opened_at: string;
};

// The contract limit: 48 hours for a wrench, 96 hours for a defect a crew found itself.
// The clock runs from when the dispatch desk opened the job.
function contractDeadline(job: JobRow): string {
  const limitHours = job.source === "wrench" ? 48 : 96;
  return new Date(Date.parse(job.opened_at) + limitHours * HOUR).toISOString();
}

export function crewQueue(database: Database, depot: string | null) {
  const jobs = database
    .query("SELECT * FROM repair_jobs WHERE closed_at IS NULL AND (?1 IS NULL OR depot = ?1)")
    .all(depot) as JobRow[];
  // Oldest job first, the way the dispatch desk has always worked.
  jobs.sort((first, second) => first.opened_at.localeCompare(second.opened_at));
  const queue = jobs.map((job) => ({ ...job, deadline: contractDeadline(job) }));
  return { depot: depot ?? "all", jobs: queue };
}
