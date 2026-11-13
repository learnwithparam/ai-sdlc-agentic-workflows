// AC-3: WHEN a crew asks for GET /crew/queue?depot=North,
// THEN the jobs come back ordered by deadline, the job due first on top.
import { afterAll, expect, test } from "bun:test";
import { getJson, startSpoke } from "./spoke";

const spoke = await startSpoke();
afterAll(() => spoke.stop());

type Job = { job_id: string; deadline: string };

test("AC-3: the North queue is ordered by deadline", async () => {
  const queue = await getJson(`${spoke.url}/crew/queue?depot=North`);
  const deadlines = (queue.jobs as Job[]).map((job) => Date.parse(job.deadline));
  const sorted = [...deadlines].sort((first, second) => first - second);
  expect(deadlines.length).toBeGreaterThan(1);
  expect(deadlines).toEqual(sorted);
});
