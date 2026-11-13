// Recorded Claude Code runs are read by type, never by position, and never show a model name.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  deniedPathsOf,
  initLineOf,
  readRun,
  runsFor,
  withoutModelNames,
} from "../checks/lib/recordings";
import { ROOT } from "../scripts/structure";

const STEP_FOLDER = join(ROOT, "parts", "01-ready-the-repo", "ready-the-repo");

test("all 3 recorded solution runs were stopped at the contract", () => {
  const runs = runsFor(join(STEP_FOLDER, "solution"), "ready-the-repo");
  expect(runs).toHaveLength(3);
  for (const run of runs) {
    expect(deniedPathsOf(run).some((path) => path.endsWith("data/contract/sla.yaml"))).toBe(true);
  }
});

test("the run with no deny rule was not stopped", () => {
  const runs = runsFor(join(STEP_FOLDER, "wrong", "no-deny-rule"), "ready-the-repo");
  expect(deniedPathsOf(runs[0])).toEqual([]);
});

test("the init line is found by its type and names the permission mode", () => {
  const run = readRun(join(ROOT, "world", "recordings", "finished"), "run-1.jsonl");
  expect(initLineOf(run)?.permissionMode).toBe("acceptEdits");
});

test("no committed recording names a model", () => {
  const files = new Bun.Glob("**/*.jsonl").scanSync({ cwd: ROOT });
  for (const file of files) {
    if (file.startsWith("node_modules") || file.startsWith("kestrel/")) continue;
    const text = readFileSync(join(ROOT, file), "utf8");
    expect(withoutModelNames(text)).toBe(text);
  }
});
