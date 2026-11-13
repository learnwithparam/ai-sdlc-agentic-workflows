// Starts the spoke service from a Kestrel repo and asks it questions over HTTP, the way the
// rider app and the crews do. Any code that answers the same way passes.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const FEED_LIMIT_SECONDS = 60;

export type RunningWorld = { url: string; logFile: string; stop: () => void };

type Vehicle = { vehicle_id: string; is_disabled: boolean };
type QueueJob = { job_id: string; deadline: string };

async function waitUntilHealthy(url: string): Promise<boolean> {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return true;
    } catch {
      // Not listening yet.
    }
    await Bun.sleep(200);
  }
  return false;
}

// Each start gets its own empty database and log, so runs never see each other's wrenches.
export async function startWorld(kestrelFolder: string): Promise<RunningWorld> {
  const scratch = mkdtempSync(join(tmpdir(), "spoke-"));
  const port = 4200 + Math.floor(Math.random() * 700);
  const logFile = join(scratch, "spoke.log");
  const environment = { ...process.env, PORT: String(port), SPOKE_LOG: logFile };
  const spoke = Bun.spawn(["bun", "src/server.ts"], {
    cwd: kestrelFolder,
    env: { ...environment, SPOKE_DB: join(scratch, "spoke.db") },
    stdout: "ignore",
    stderr: "ignore",
  });
  const url = `http://localhost:${port}`;
  const stop = () => spoke.kill();
  if (!(await waitUntilHealthy(url))) {
    stop();
    throw new Error("spoke did not start; run bun run world in kestrel/ to see why");
  }
  return { url, logFile, stop };
}

async function bikeIsDisabled(url: string, bikeId: string): Promise<boolean> {
  const feed = await (await fetch(`${url}/gbfs/v3/vehicle_status.json`)).json();
  const vehicles = feed.data.vehicles as Vehicle[];
  return vehicles.find((vehicle) => vehicle.vehicle_id === bikeId)?.is_disabled === true;
}

// The feature's promise: a wrenched bike shows is_disabled: true in the feed within 60 seconds.
export async function wrenchLeavesTheFeed(url: string, bikeId: string): Promise<boolean> {
  const body = JSON.stringify({ bike_id: bikeId, fault: "BRAKE" });
  const reply = await fetch(`${url}/wrench`, { method: "POST", body });
  if (!reply.ok) return false;
  const giveUpAt = Date.now() + FEED_LIMIT_SECONDS * 1000;
  while (Date.now() < giveUpAt) {
    if (await bikeIsDisabled(url, bikeId)) return true;
    await Bun.sleep(500);
  }
  return false;
}

// The crews work top down, so the job that is due first must be on top.
export async function queueIsDueFirst(url: string, depot: string): Promise<boolean> {
  const queue = await (await fetch(`${url}/crew/queue?depot=${depot}`)).json();
  const deadlines = (queue.jobs as QueueJob[]).map((job) => Date.parse(job.deadline));
  if (deadlines.length < 2) return false;
  return deadlines.every((deadline, index) => index === 0 || deadlines[index - 1] <= deadline);
}

export async function withWorld<Answer>(
  kestrelFolder: string,
  question: (world: RunningWorld) => Promise<Answer>,
): Promise<Answer> {
  const world = await startWorld(kestrelFolder);
  try {
    return await question(world);
  } finally {
    world.stop();
  }
}
