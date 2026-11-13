// AC-2: WHEN a rider wrenches a bike at a station,
// THEN station_status.json shows num_vehicles_disabled for that station up by 1 within 60 seconds.
import { afterAll, expect, test } from "bun:test";
import { becomesTrue, getJson, startSpoke, wrench } from "./spoke";

const spoke = await startSpoke();
afterAll(() => spoke.stop());

type Vehicle = { vehicle_id: string; station_id: string };
type Station = { station_id: string; num_vehicles_disabled: number };

async function disabledAt(stationId: string): Promise<number> {
  const feed = await getJson(`${spoke.url}/gbfs/v3/station_status.json`);
  const stations = feed.data.stations as Station[];
  return stations.find((station) => station.station_id === stationId)?.num_vehicles_disabled ?? 0;
}

test("AC-2: the station's disabled count goes up by one", async () => {
  const feed = await getJson(`${spoke.url}/gbfs/v3/vehicle_status.json`);
  const bike = (feed.data.vehicles as Vehicle[]).find((vehicle) => vehicle.vehicle_id === "B-1500");
  const stationId = bike?.station_id ?? "";
  const before = await disabledAt(stationId);
  await wrench(spoke.url, "B-1500");
  const countWentUp = async () => (await disabledAt(stationId)) === before + 1;
  expect(await becomesTrue(countWentUp, 5)).toBe(true);
}, 10_000);
