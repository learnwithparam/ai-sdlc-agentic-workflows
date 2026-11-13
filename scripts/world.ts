// bun run world                 start spoke from your kestrel/ on http://localhost:4100
// bun run world reset           wipe spoke's database; it is rebuilt from data/ on the next start
// bun run world wrench B-2207   report a broken bike, the way the rider app does
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { WORKSPACE } from "./structure";

const WORLD_URL = "http://localhost:4100";

function needWorkspace() {
  if (existsSync(WORKSPACE)) return;
  console.log("There is no kestrel/ folder yet. Make it first: bun run start meet-kestrel");
  process.exit(1);
}

function resetWorld() {
  rmSync(join(WORKSPACE, "spoke.db"), { force: true });
  rmSync(join(WORKSPACE, "logs"), { recursive: true, force: true });
  console.log("The world is reset. spoke rebuilds its database from data/ when it starts.");
}

async function bikeInFeed(bikeId: string) {
  const feed = await (await fetch(`${WORLD_URL}/gbfs/v3/vehicle_status.json`)).json();
  const vehicles = feed.data.vehicles as { vehicle_id: string; is_disabled: boolean }[];
  return vehicles.find((vehicle) => vehicle.vehicle_id === bikeId);
}

async function reportBrokenBike(bikeId: string) {
  try {
    const body = JSON.stringify({ bike_id: bikeId, fault: "BRAKE" });
    const reply = await fetch(`${WORLD_URL}/wrench`, { method: "POST", body });
    if (!reply.ok) return console.log(`spoke said no: ${JSON.stringify(await reply.json())}`);
    await Bun.sleep(1000);
    const bike = await bikeInFeed(bikeId);
    console.log(`Reported ${bikeId} as broken.`);
    console.log(`The public feed shows ${bikeId} with is_disabled: ${bike?.is_disabled}.`);
  } catch {
    console.log("spoke is not running. Start it in another terminal: bun run world");
    process.exit(1);
  }
}

if (import.meta.main) {
  const [action, bikeId] = process.argv.slice(2);
  needWorkspace();
  if (action === "reset") resetWorld();
  else if (action === "wrench") await reportBrokenBike(bikeId ?? "B-2207");
  else {
    const spoke = Bun.spawn(["bun", "run", "world"], {
      cwd: WORKSPACE,
      stdio: ["inherit", "inherit", "inherit"],
    });
    process.exit(await spoke.exited);
  }
}
