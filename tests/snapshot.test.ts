// A step folder holds only what differs from the base world; a check still reads a whole repo.
import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { kestrelFolderFor } from "../checks/lib/snapshot";
import { ROOT } from "../scripts/structure";

const solution = join(ROOT, "parts", "01-ready-the-repo", "ready-the-repo", "solution");

test("a snapshot has the base world and the step's own files", () => {
  const folder = kestrelFolderFor(solution);
  expect(existsSync(join(folder, "src", "server.ts"))).toBe(true);
  expect(existsSync(join(folder, "CLAUDE.md"))).toBe(true);
});

test("course files such as prompts.md stay out of the Kestrel repo", () => {
  const folder = kestrelFolderFor(solution);
  expect(existsSync(join(folder, "prompts.md"))).toBe(false);
});

test("a snapshot with a history bundle has git history", () => {
  const folder = kestrelFolderFor(join(ROOT, "world", "finished"));
  expect(existsSync(join(folder, ".git"))).toBe(true);
});
