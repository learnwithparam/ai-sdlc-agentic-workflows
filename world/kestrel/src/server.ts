// spoke: Kestrel's service. It serves the public feed, takes wrench reports and lists crew jobs.
// Start it with: bun run world
import { crewQueue } from "./crew-queue";
import { openDatabase } from "./database";
import { stationStatus, vehicleStatus } from "./feed";
import { mapPage } from "./map-page";
import { recordWrench } from "./wrenches";

const PORT = Number(process.env.PORT ?? 4100);
const database = openDatabase();

const asJson = (body: unknown, status = 200) => Response.json(body, { status });

async function handleWrench(request: Request): Promise<Response> {
  const report = await request.json().catch(() => ({}));
  const outcome = recordWrench(database, report);
  return asJson(outcome.body, outcome.status);
}

function handleQueue(request: Request): Response {
  const depot = new URL(request.url).searchParams.get("depot");
  return asJson(crewQueue(database, depot));
}

const server = Bun.serve({
  port: PORT,
  routes: {
    "/": () => new Response(mapPage(database), { headers: { "content-type": "text/html" } }),
    "/health": () => asJson({ ok: true }),
    "/gbfs/v3/vehicle_status.json": () => asJson(vehicleStatus(database)),
    "/gbfs/v3/station_status.json": () => asJson(stationStatus(database)),
    "/wrench": { POST: handleWrench },
    "/crew/queue": handleQueue,
  },
  fetch: () => asJson({ error: "no such page" }, 404),
});

console.log(`spoke is running on http://localhost:${server.port}`);
