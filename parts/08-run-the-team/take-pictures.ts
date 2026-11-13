// bun parts/08-run-the-team/take-pictures.ts: the pictures for this part's steps.
//
// For course authors. For each step it catches kestrel/ up to the step's sample end state, runs
// the real bun run verify, and draws the output in a dark terminal 800 pixels wide, the same way
// scripts/shots.ts does. Older copies of kestrel/ are moved to .kestrel-backups/, never deleted.
import { join } from "node:path";
import { findStep, ROOT } from "../../scripts/structure";

const STEPS = ["measure-the-lifecycle", "write-the-team-playbook", "ship-the-feature"];

type Page = {
  setContent: (html: string) => Promise<void>;
  screenshot: (options: object) => Promise<unknown>;
};
type Browser = { newPage: (options: object) => Promise<Page>; close: () => Promise<void> };

const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function runForPicture(command: string): string {
  const environment = { ...process.env, CI: "true" };
  const result = Bun.spawnSync(command.split(" "), { cwd: ROOT, env: environment });
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

async function pictureOfStep(browser: Browser, step: string) {
  Bun.spawnSync(["bun", "run", "catch-up", step], { cwd: ROOT });
  const text = runForPicture(`bun run verify ${step}`);
  const page = await browser.newPage({
    viewport: { width: 800, height: 200 },
    deviceScaleFactor: 2,
  });
  await page.setContent(terminalPage(text));
  const picture = join(findStep(step)?.dir ?? "", "images", "expected.png");
  await page.screenshot({ path: picture, fullPage: true });
  console.log(`Saved ${picture.replace(`${ROOT}/`, "")}`);
}

if (import.meta.main) {
  const { chromium } = require("playwright");
  const browser: Browser = await chromium.launch();
  try {
    for (const step of STEPS) await pictureOfStep(browser, step);
  } finally {
    await browser.close();
  }
}
