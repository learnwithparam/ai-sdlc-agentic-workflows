// A-1 (postmortem, North double wrench): the rider app retries a failed POST /wrench up to
// 3 times with the same request_id. A retry is the same report, not a new one.
// src/database reads SPOKE_DB and src/log reads SPOKE_LOG when they load, so set them first.
import { expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
process.env.SPOKE_DB = join(tmpdir(), `spoke-regression-${runId}.db`);
process.env.SPOKE_LOG = join(tmpdir(), `spoke-regression-${runId}.log`);

const { openDatabase } = await import("../../src/database");
const { recordWrench } = await import("../../src/wrenches");

const db = openDatabase();

const count = (sql: string, bikeId: string) => (db.query(sql).get(bikeId) as { n: number }).n;

test("A-1: the same wrench three times with one request_id gives one repair job", () => {
  const BIKE = "B-1040"; // no seed job, so it starts rentable with no wrenches or jobs
  const report = { bike_id: BIKE, fault: "BRAKE", request_id: "app-retry-7f3c" };

  const replies = [recordWrench(db, report), recordWrench(db, report), recordWrench(db, report)];

  // The first is created; each retry is not a new 201 and gets the same job back.
  expect(replies[0].status).toBe(201);
  const jobId = (replies[0].body as { job_id: string }).job_id;
  for (const reply of replies) {
    expect((reply.body as { job_id: string }).job_id).toBe(jobId);
  }
  for (const retry of replies.slice(1)) expect(retry.status).not.toBe(201);

  expect(count("SELECT COUNT(*) AS n FROM wrenches WHERE bike_id = ?", BIKE)).toBe(1);
  expect(
    count(
      "SELECT COUNT(*) AS n FROM repair_jobs WHERE bike_id = ? AND source = 'wrench' AND closed_at IS NULL",
      BIKE,
    ),
  ).toBe(1);
  const bike = db.query("SELECT is_disabled FROM bikes WHERE bike_id = ?").get(BIKE) as {
    is_disabled: number;
  };
  expect(bike.is_disabled).toBe(1);
});
