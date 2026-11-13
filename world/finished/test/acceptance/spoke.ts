// Starts a fresh spoke for one test file and talks to it over HTTP, the way the rider app does.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type Spoke = { url: string; stop: () => void };

export async function startSpoke(): Promise<Spoke> {
  const scratch = mkdtempSync(join(tmpdir(), "spoke-acceptance-"));
  const port = 5100 + Math.floor(Math.random() * 800);
  const environment = {
    ...process.env,
    PORT: String(port),
    SPOKE_DB: join(scratch, "spoke.db"),
    SPOKE_LOG: join(scratch, "spoke.log"),
  };
  const server = Bun.spawn(["bun", "src/server.ts"], { env: environment, stdout: "ignore" });
  const url = `http://localhost:${port}`;
  for (let attempt = 0; attempt < 50; attempt++) {
    const healthy = await fetch(`${url}/health`).then(
      (response) => response.ok,
      () => false,
    );
    if (healthy) return { url, stop: () => server.kill() };
    await Bun.sleep(200);
  }
  server.kill();
  throw new Error("spoke did not start");
}

export async function getJson(url: string) {
  const response = await fetch(url);
  return response.json();
}

export async function wrench(url: string, bikeId: string, requestId?: string) {
  const body = JSON.stringify({ bike_id: bikeId, fault: "BATT", request_id: requestId });
  return fetch(`${url}/wrench`, { method: "POST", body });
}

// Asks again every half second until the answer is true or the time is up.
export async function becomesTrue(question: () => Promise<boolean>, seconds: number) {
  const giveUpAt = Date.now() + seconds * 1000;
  while (Date.now() < giveUpAt) {
    if (await question()) return true;
    await Bun.sleep(500);
  }
  return false;
}
