// AC-4: WHEN a job comes from a wrench,
// THEN its deadline is 48 hours after the wrench reported_at: the clock starts at the wrench.
import { afterAll, expect, test } from "bun:test";
import { getJson, startSpoke } from "./spoke";

const spoke = await startSpoke();
afterAll(() => spoke.stop());

const HOUR = 60 * 60 * 1000;

type Job = { source: string; reported_at: string; opened_at: string; deadline: string };

test("AC-4: a wrench job is due 48 hours after the wrench", async () => {
  const queue = await getJson(`${spoke.url}/crew/queue`);
  const wrenchJobs = (queue.jobs as Job[]).filter((job) => job.source === "wrench");
  expect(wrenchJobs.length).toBeGreaterThan(0);
  for (const job of wrenchJobs) {
    const expected = Date.parse(job.reported_at) + 48 * HOUR;
    expect(Date.parse(job.deadline)).toBe(expected);
  }
});
