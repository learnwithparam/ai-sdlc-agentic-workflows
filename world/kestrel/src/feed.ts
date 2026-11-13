// The public feed in GBFS v3 shape: https://github.com/MobilityData/gbfs/blob/master/gbfs.md
// Rider apps and the city read it. The contract says it must be accurate at all times.
import type { Database } from "bun:sqlite";

const FEED_VERSION = "3.0";
const SECONDS_UNTIL_STALE = 60;

type BikeRow = { bike_id: string; bike_type: string; station_id: string; is_disabled: number };
type StationCount = { station_id: string; docks: number; available: number; disabled: number };

function wrapInFeed(data: object) {
  const lastUpdated = new Date().toISOString();
  return { last_updated: lastUpdated, ttl: SECONDS_UNTIL_STALE, version: FEED_VERSION, data };
}

export function vehicleStatus(database: Database) {
  const bikes = database.query("SELECT * FROM bikes ORDER BY bike_id").all() as BikeRow[];
  const vehicles = bikes.map((bike) => ({
    vehicle_id: bike.bike_id,
    station_id: bike.station_id,
    vehicle_type_id: bike.bike_type,
    is_reserved: false,
    is_disabled: bike.is_disabled === 1,
  }));
  return wrapInFeed({ vehicles });
}

const STATION_COUNTS = `
  SELECT stations.station_id, stations.docks,
    SUM(CASE WHEN bikes.is_disabled = 0 THEN 1 ELSE 0 END) AS available,
    SUM(CASE WHEN bikes.is_disabled = 1 THEN 1 ELSE 0 END) AS disabled
  FROM stations LEFT JOIN bikes ON bikes.station_id = stations.station_id
  GROUP BY stations.station_id ORDER BY stations.station_id`;

export function stationStatus(database: Database) {
  const counts = database.query(STATION_COUNTS).all() as StationCount[];
  const stations = counts.map((count) => ({
    station_id: count.station_id,
    num_vehicles_available: count.available ?? 0,
    num_vehicles_disabled: count.disabled ?? 0,
    num_docks_available: Math.max(0, count.docks - (count.available ?? 0) - (count.disabled ?? 0)),
    is_renting: true,
    is_returning: true,
  }));
  return wrapInFeed({ stations });
}
