// The human gate: an approval holds only while the file is exactly as it was approved.
import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { approvalHolds, approvedInOrder } from "../checks/lib/approvals";
import { contentHash } from "../checks/lib/files";

function repoWithIntent(intentText: string): string {
  const folder = mkdtempSync(join(tmpdir(), "approvals-test-"));
  mkdirSync(join(folder, "work"));
  writeFileSync(join(folder, "work", "intent.md"), intentText);
  return folder;
}

function approve(folder: string, file: string, role: string) {
  const line = { file, sha256: contentHash(folder, file), role, at: "now", by: "Theo" };
  const approvals = join(folder, "work", "approvals.jsonl");
  writeFileSync(approvals, `${JSON.stringify(line)}\n`, { flag: "a" });
}

test("an approval holds while the file is unchanged", () => {
  const folder = repoWithIntent("# Intent\n");
  approve(folder, "work/intent.md", "pm");
  expect(approvalHolds(folder, "work/intent.md", "pm")).toBe(true);
});

test("a late edit opens the gate again", () => {
  const folder = repoWithIntent("# Intent\n");
  approve(folder, "work/intent.md", "pm");
  writeFileSync(join(folder, "work", "intent.md"), "# Intent, edited after approval\n");
  expect(approvalHolds(folder, "work/intent.md", "pm")).toBe(false);
});

test("an approval by the wrong role does not count", () => {
  const folder = repoWithIntent("# Intent\n");
  approve(folder, "work/intent.md", "qa");
  expect(approvalHolds(folder, "work/intent.md", "pm")).toBe(false);
});

test("gates must come in order", () => {
  const folder = repoWithIntent("# Intent\n");
  writeFileSync(join(folder, "work", "spec.md"), "# Spec\n");
  approve(folder, "work/spec.md", "pm");
  approve(folder, "work/intent.md", "pm");
  expect(approvedInOrder(folder, "work/intent.md", "work/spec.md")).toBe(false);
});

test("a folder is signed as one, so changing any file in it breaks the gate", () => {
  const folder = repoWithIntent("# Intent\n");
  mkdirSync(join(folder, "tests"));
  writeFileSync(join(folder, "tests", "ac-1.test.ts"), "test one\n");
  const before = contentHash(folder, "tests");
  writeFileSync(join(folder, "tests", "ac-1.test.ts"), "test one, weakened\n");
  expect(contentHash(folder, "tests")).not.toBe(before);
});
