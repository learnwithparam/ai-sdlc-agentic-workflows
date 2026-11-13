// The station table under the map must show the same counts as the public feed.
import { expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.SPOKE_DB = join(tmpdir(), `spoke-map-test-${Date.now()}.db`);
process.env.SPOKE_LOG = join(tmpdir(), `spoke-map-test-${Date.now()}.log`);
const { openDatabase } = await import("../src/database");
const { stationStatus } = await import("../src/feed");
const { mapPage, stationTableRows } = await import("../src/map-page");

const database = openDatabase();
const feed = stationStatus(database).data.stations;

test("the station table has one row for each station in the feed", () => {
  expect(stationTableRows(database)).toHaveLength(feed.length);
});

test("the table counts add up to the feed counts", () => {
  const rows = stationTableRows(database);
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  expect(sum(rows.map((row) => row.toRent))).toBe(sum(feed.map((s) => s.num_vehicles_available)));
  expect(sum(rows.map((row) => row.broken))).toBe(sum(feed.map((s) => s.num_vehicles_disabled)));
});

test("the page has a language, a viewport and a fluid map", () => {
  const page = mapPage(database);
  expect(page).toContain('<html lang="en">');
  expect(page).toContain('name="viewport"');
  expect(page).toContain('<svg width="100%" viewBox="0 0 940 660"');
});
