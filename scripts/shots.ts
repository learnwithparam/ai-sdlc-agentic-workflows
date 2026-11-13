// bun scripts/shots.ts: takes every picture the pages show, from the real commands and pages.
//
// Terminal pictures run the real command and draw its output in a dark terminal, 800 pixels wide.
// Map pictures start the real spoke service and photograph its page in Chromium.
// Course authors run this after a change. Learners never need it.
import { join } from "node:path";
import { buildSnapshot } from "../checks/lib/snapshot";
import { startWorld } from "../checks/lib/world";
import { ROOT } from "./structure";

type Browser = { newPage: (options: object) => Promise<Page>; close: () => Promise<void> };
type Page = {
  setContent: (html: string) => Promise<void>;
  goto: (url: string) => Promise<unknown>;
  screenshot: (options: object) => Promise<unknown>;
};

const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function runForPicture(command: string): string {
  const words = command.split(" ");
  const environment = { ...process.env, CI: "true" };
  const result = Bun.spawnSync(words, { cwd: ROOT, env: environment, stderr: "pipe" });
  const output = result.stdout.toString() + result.stderr.toString();
  // bun echoes each script it starts, as "$ bun ...". The picture shows the command once.
  const outputLines = output.split("\n").filter((line) => !line.startsWith("$ bun "));
  const shortLines = outputLines.map((line) => line.slice(0, 96));
  return `$ ${command}\n${shortLines.join("\n").trim()}`;
}

function terminalPage(text: string): string {
  const style = `body{margin:0;background:#0f172a}pre{margin:0;padding:20px;color:#e2e8f0;
    font:13px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;width:760px}`;
  return `<!doctype html><style>${style}</style><pre>${escapeHtml(text)}</pre>`;
}

async function terminalShot(browser: Browser, commands: string[], picture: string) {
  const text = commands.map(runForPicture).join("\n\n");
  const page = await browser.newPage({
    viewport: { width: 800, height: 200 },
    deviceScaleFactor: 2,
  });
  await page.setContent(terminalPage(text));
  await page.screenshot({ path: join(ROOT, picture), fullPage: true });
  console.log(`Saved ${picture}`);
}

async function mapShot(browser: Browser, kestrelFolder: string, picture: string) {
  const world = await startWorld(kestrelFolder);
  await fetch(`${world.url}/wrench`, { method: "POST", body: '{"bike_id":"B-2207"}' });
  const page = await browser.newPage({
    viewport: { width: 1000, height: 780 },
    deviceScaleFactor: 2,
  });
  await page.goto(world.url);
  await page.screenshot({ path: join(ROOT, picture), fullPage: true });
  world.stop();
  console.log(`Saved ${picture}`);
}

function catchUp(step: string) {
  Bun.spawnSync(["bun", "run", "catch-up", step], { cwd: ROOT });
}

async function takeEveryPicture(browser: Browser) {
  const finished = buildSnapshot(join(ROOT, "world", "finished"));
  await terminalShot(browser, ["bun run finished --replay"], "images/finished-system.png");
  await mapShot(browser, finished, "images/kestrel-map-finished.png");
  await mapShot(browser, join(ROOT, "world", "kestrel"), "00-orientation/images/kestrel-map.png");
  const firstRun = ["bun run start meet-kestrel", "bun run verify meet-kestrel"];
  await terminalShot(browser, firstRun, "00-orientation/images/first-run.png");
  catchUp("meet-kestrel");
  const orientationPicture = "00-orientation/meet-kestrel/images/expected.png";
  await terminalShot(browser, ["bun run verify meet-kestrel"], orientationPicture);
  catchUp("ready-the-repo");
  const readyPicture = "parts/01-ready-the-repo/ready-the-repo/images/expected.png";
  await terminalShot(browser, ["bun run verify ready-the-repo"], readyPicture);
  console.log(
    "kestrel/ now holds the end of ready-the-repo. Older copies are in .kestrel-backups/",
  );
}

if (import.meta.main) {
  const { chromium } = require("playwright");
  const browser: Browser = await chromium.launch();
  try {
    await takeEveryPicture(browser);
  } finally {
    await browser.close();
  }
}
