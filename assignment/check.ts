// bun assignment/check.ts: the live check for the assignment. The compose stack must be running.
// It reads the flag for one user inside North and one outside before and after your edit,
// then writes assignment/result.json with one pass or fail per Done-when line.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HERE = import.meta.dir;
const READER = process.env.READER_URL ?? "http://localhost:8080";
const FLAG_FILE = join(HERE, "flags", "flagd.json");
const STARTER = join(HERE, "flags", "flagd.starter.json");
const WAIT_SECONDS = 20;

type Answer = { value: boolean; started: string };
const ask = async (user: string, district: string): Promise<Answer> =>
  (await fetch(`${READER}/flag?user=${user}&district=${district}`)).json() as Promise<Answer>;

// The flagd file watcher takes a moment, so poll until the answer is the one we want.
async function waitFor(user: string, district: string, want: boolean): Promise<Answer> {
  let answer = await ask(user, district);
  for (let waited = 0; answer.value !== want && waited < WAIT_SECONDS; waited++) {
    await Bun.sleep(1000);
    answer = await ask(user, district);
  }
  return answer;
}

function version(name: string): string {
  const installed = join(HERE, "reader", "node_modules", name, "package.json");
  return existsSync(installed) ? JSON.parse(readFileSync(installed, "utf8")).version : "not found";
}

const mine = readFileSync(FLAG_FILE, "utf8");
const lines: Record<string, "pass" | "fail"> = {};
try {
  copyFileSync(STARTER, FLAG_FILE);
  const before = await waitFor("u-100", "North", false);
  writeFileSync(FLAG_FILE, mine);
  const after = await waitFor("u-100", "North", true);
  const outside = await waitFor("u-200", "East", false);
  lines["The flag reads off then on for a user in the group, with no restart"] =
    !before.value && after.value && before.started === after.started ? "pass" : "fail";
  lines["A user outside the group still reads off"] = !outside.value ? "pass" : "fail";
} catch (error) {
  console.log(`Could not reach the reader at ${READER}: ${(error as Error).message}`);
  for (const line of [
    "The flag reads off then on for a user in the group, with no restart",
    "A user outside the group still reads off",
  ]) {
    lines[line] ??= "fail";
  }
} finally {
  writeFileSync(FLAG_FILE, mine); // your edit is always put back
}

const flagd = readFileSync(join(HERE, "compose.yml"), "utf8").match(/flagd:(v[\d.]+)/)?.[1];
const result = {
  lines,
  versions: {
    flagd,
    "@openfeature/server-sdk": version("@openfeature/server-sdk"),
    "@openfeature/flagd-provider": version("@openfeature/flagd-provider"),
  },
};
writeFileSync(join(HERE, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
for (const [line, outcome] of Object.entries(lines))
  console.log(`${outcome.toUpperCase()}  ${line}`);
process.exit(Object.values(lines).every((outcome) => outcome === "pass") ? 0 : 1);
