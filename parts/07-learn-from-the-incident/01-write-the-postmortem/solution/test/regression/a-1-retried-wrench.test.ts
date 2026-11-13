// A-1 (postmortem: the double wrench incident in North district).
// WHEN the rider app retries POST /wrench with the same request_id,
// THEN spoke keeps one report: one repair job for the bike, and every retry gets that job back.
import { afterAll, expect, test } from "bun:test";
import { getJson, startSpoke, wrench } from "../acceptance/spoke";

const spoke = await startSpoke();
afterAll(() => spoke.stop());

type Job = { job_id: string; bike_id: string };

async function jobsFor(bikeId: string): Promise<Job[]> {
  const queue = await getJson(`${spoke.url}/crew/queue`);
  return (queue.jobs as Job[]).filter((job) => job.bike_id === bikeId);
}

test("A-1: the same wrench sent three times with one request_id opens one repair job", async () => {
  expect(await jobsFor("B-2207")).toHaveLength(0);

  const responses = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    responses.push(await wrench(spoke.url, "B-2207", "req-a1-retry"));
  }
  const bodies = await Promise.all(responses.map((response) => response.json()));

  const jobs = await jobsFor("B-2207");
  expect(jobs).toHaveLength(1);
  // Every retry answers with the job the first report opened.
  for (const body of bodies) expect(body.job_id).toBe(jobs[0].job_id);
}, 15_000);
