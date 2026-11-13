// GET /: a map of Brannock's stations. A red number is how many broken bikes wait at a station.
import type { Database } from "bun:sqlite";
import { stationStatus } from "./feed";

type StationRow = { station_id: string; name: string; district: string; x: number; y: number };

const DISTRICT_COLOURS: Record<string, string> = {
  North: "#3b82f6",
  East: "#14b8a6",
  Centre: "#a855f7",
  South: "#f59e0b",
  West: "#22c55e",
};

function stationDot(station: StationRow, brokenBikes: number): string {
  const colour = DISTRICT_COLOURS[station.district] ?? "#888";
  const dot = `<circle cx="${station.x}" cy="${station.y}" r="9" fill="${colour}">`;
  const title = `<title>${station.station_id} ${station.name}</title></circle>`;
  if (brokenBikes === 0) return dot + title;
  const badge = `<circle cx="${station.x + 9}" cy="${station.y - 9}" r="8" fill="#dc2626"/>`;
  const count = `<text x="${station.x + 9}" y="${station.y - 5}">${brokenBikes}</text>`;
  return dot + title + badge + count;
}

function legend(totalBroken: number, totalAvailable: number): string {
  const districts = Object.entries(DISTRICT_COLOURS)
    .map(([name, colour]) => `<span><i style="background:${colour}"></i>${name}</span>`)
    .join("");
  return `<p class="legend">${districts}</p>
    <p><b>${totalAvailable}</b> bikes riders can rent. <b class="red">${totalBroken}</b> broken
    bikes out of service. Red numbers show broken bikes waiting at a station.</p>`;
}

const STYLE = `body{font-family:system-ui,sans-serif;margin:24px;background:#f8fafc;color:#0f172a}
  h1{margin:0 0 4px}svg{background:#fff;border:1px solid #cbd5e1;border-radius:8px}
  text{font-size:10px;fill:#fff;text-anchor:middle;font-weight:700}
  .legend span{margin-right:14px}.legend i{display:inline-block;width:10px;height:10px;
  border-radius:50%;margin-right:4px}.red{color:#dc2626}`;

export function mapPage(database: Database): string {
  const stations = database.query("SELECT * FROM stations").all() as StationRow[];
  const feed = stationStatus(database).data.stations;
  const brokenAt = new Map(feed.map((entry) => [entry.station_id, entry.num_vehicles_disabled]));
  const dots = stations.map((station) =>
    stationDot(station, brokenAt.get(station.station_id) ?? 0),
  );
  const totalBroken = feed.reduce((sum, entry) => sum + entry.num_vehicles_disabled, 0);
  const totalAvailable = feed.reduce((sum, entry) => sum + entry.num_vehicles_available, 0);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Kestrel Bike Share</title>
    <style>${STYLE}</style></head><body><h1>Kestrel Bike Share: Brannock</h1>
    ${legend(totalBroken, totalAvailable)}
    <svg width="940" height="660" viewBox="0 0 940 660">${dots.join("")}</svg></body></html>`;
}
