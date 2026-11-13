// AC-1: WHEN a rider sends POST /wrench for a bike,
// THEN vehicle_status.json shows that bike with is_disabled: true within 60 seconds.
import { afterAll, expect, test } from "bun:test";
import { becomesTrue, getJson, startSpoke, wrench } from "./spoke";

const spoke = await startSpoke();
afterAll(() => spoke.stop());

type Vehicle = { vehicle_id: string; is_disabled: boolean };

async function isDisabled(bikeId: string): Promise<boolean> {
  const feed = await getJson(`${spoke.url}/gbfs/v3/vehicle_status.json`);
  const bike = (feed.data.vehicles as Vehicle[]).find((vehicle) => vehicle.vehicle_id === bikeId);
  return bike?.is_disabled === true;
}

test("AC-1: a wrenched bike shows is_disabled: true in the feed", async () => {
  expect(await isDisabled("B-2207")).toBe(false);
  await wrench(spoke.url, "B-2207");
  // The contract allows 60 seconds. spoke should take far less, so the test waits 5.
  expect(await becomesTrue(() => isDisabled("B-2207"), 5)).toBe(true);
}, 10_000);
