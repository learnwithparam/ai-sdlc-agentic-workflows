// The commands a learner types say the right thing, with no model and no Claude Code needed.
import { expect, test } from "bun:test";
import { isAtLeast } from "../scripts/doctor";
import { ROOT } from "../scripts/structure";

function runCommand(words: string[], extraEnvironment: Record<string, string> = {}) {
  const environment = { ...process.env, ...extraEnvironment };
  const result = Bun.spawnSync(words, { cwd: ROOT, env: environment });
  return { exitCode: result.exitCode, output: result.stdout.toString() };
}

test("the finished chain replays and holds", () => {
  const result = runCommand(["bun", "world/finished.ts", "--replay"]);
  expect(result.output).toContain("This is a replay of a recorded run.");
  expect(result.output).toContain("The finished chain holds: 11 gates");
  expect(result.exitCode).toBe(0);
}, 60_000);

test("approve refuses when Claude Code runs it", () => {
  const result = runCommand(["bun", "scripts/approve.ts", "work/intent.md", "--role", "pm"], {
    CLAUDECODE: "1",
  });
  expect(result.output).toContain("Only a person can approve.");
  expect(result.exitCode).toBe(1);
});

test("doctor compares versions part by part", () => {
  expect(isAtLeast("2.1.323", "2.1.302")).toBe(true);
  expect(isAtLeast("2.1.250", "2.1.302")).toBe(false);
  expect(isAtLeast("2.10.0", "2.9.9")).toBe(true);
});
