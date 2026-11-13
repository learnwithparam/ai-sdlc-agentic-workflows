// Action item A-1 from work/postmortem.md: a retry with the same request_id is one report.
// In the incident, the app sent each report up to 3 times and 212 bikes got duplicate jobs.
import { afterAll, expect, test } from "bun:test";
import { getJson, startSpoke, wrench } from "../acceptance/spoke";

const spoke = await startSpoke();
afterAll(() => spoke.stop());

type Job = { bike_id: string };

test("A-1: three retries of one wrench open one job", async () => {
  for (let retry = 0; retry < 3; retry++) await wrench(spoke.url, "B-2400", "request-77");
  const queue = await getJson(`${spoke.url}/crew/queue`);
  const jobsForBike = (queue.jobs as Job[]).filter((job) => job.bike_id === "B-2400");
  expect(jobsForBike).toHaveLength(1);
});
