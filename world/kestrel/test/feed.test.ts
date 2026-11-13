// The tests the team already had. They pass today, which is why nobody saw the wrench bug.
import { expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.SPOKE_DB = join(tmpdir(), `spoke-test-${Date.now()}.db`);
process.env.SPOKE_LOG = join(tmpdir(), `spoke-test-${Date.now()}.log`);
const { openDatabase } = await import("../src/database");
const { stationStatus, vehicleStatus } = await import("../src/feed");

const database = openDatabase();

test("the vehicle feed lists all 2,100 bikes", () => {
  expect(vehicleStatus(database).data.vehicles).toHaveLength(2100);
});

test("the station feed lists all 180 stations", () => {
  expect(stationStatus(database).data.stations).toHaveLength(180);
});

test("bikes with an open repair job are disabled in the feed", () => {
  const disabled = vehicleStatus(database).data.vehicles.filter((bike) => bike.is_disabled);
  expect(disabled.length).toBeGreaterThan(0);
});
