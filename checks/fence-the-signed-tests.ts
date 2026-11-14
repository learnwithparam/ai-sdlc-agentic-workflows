// fence-the-signed-tests: hooks that hold the rule when nobody is watching. The check does not
// read the settings file as proof. It runs the registered commands and reads their exit codes.

import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readJson } from "./lib/files";
import type { Rule } from "./lib/rule";

// The hooks the learner registered in .claude/settings.json, as the command line Claude Code runs.
type HookEntry = { matcher?: string; hooks?: { command?: string }[] };

function hookCommand(folder: string, event: string, matcher?: string): string | undefined {
  const settings = readJson(folder, ".claude/settings.json") as
    | { hooks?: Record<string, HookEntry[]> }
    | undefined;
  const entries = settings?.hooks?.[event] ?? [];
  const wanted = entries.filter((entry) => !matcher || (entry.matcher ?? "").includes(matcher));
  return wanted.flatMap((entry) => entry.hooks ?? []).find((hook) => hook.command)?.command;
}

// Runs a registered hook the way Claude Code does: a shell command, the call as JSON on stdin.
function runHook(command: string, cwd: string, payload: object): number {
  const run = Bun.spawnSync(["sh", "-c", command], {
    cwd,
    stdin: Buffer.from(JSON.stringify(payload)),
    stdout: "pipe",
    stderr: "pipe",
  });
  return run.exitCode ?? 1;
}

function editHookExit(folder: string, file: string): number | undefined {
  const command = hookCommand(folder, "PreToolUse", "Edit");
  if (!command) return undefined;
  return runHook(command, folder, { tool_name: "Edit", tool_input: { file_path: file } });
}

// A tiny repo with one test, so the Stop hook is tried on a known red and a known green.
function stopHookExit(folder: string, testPasses: boolean): number | undefined {
  const command = hookCommand(folder, "Stop");
  if (!command) return undefined;
  const sandbox = mkdtempSync(join(tmpdir(), "kestrel-stop-"));
  cpSync(join(folder, ".claude"), join(sandbox, ".claude"), { recursive: true });
  mkdirSync(join(sandbox, "test"));
  const expected = testPasses ? 1 : 2;
  const imports = 'import { expect, test } from "bun:test";';
  const body = `${imports}\ntest("t", () => expect(1).toBe(${expected}));\n`;
  writeFileSync(join(sandbox, "test", "t.test.ts"), body);
  const exit = runHook(command, sandbox, { hook_event_name: "Stop", stop_hook_active: false });
  rmSync(sandbox, { recursive: true, force: true });
  return exit;
}

export default [
  {
    says: "settings.json registers an edit hook and a Stop hook that run commands",
    test: (folder) =>
      hookCommand(folder, "PreToolUse", "Edit") !== undefined &&
      hookCommand(folder, "PreToolUse", "Write") !== undefined &&
      hookCommand(folder, "Stop") !== undefined,
    tryNext: "ask Claude Code to add a PreToolUse hook for Edit and Write, and a Stop hook",
  },
  {
    says: "the edit hook exits 2 when Claude edits a file in test/acceptance",
    test: (folder) => editHookExit(folder, "test/acceptance/ac-1-wrench.test.ts") === 2,
    tryNext: "the hook must exit 2 for any path under test/acceptance/; run it by hand to see",
  },
  {
    says: "the edit hook exits 0 when Claude edits a file in src",
    test: (folder) => editHookExit(folder, "src/wrenches.ts") === 0,
    tryNext: "the hook must let src/ through with exit 0, or Claude cannot build anything",
  },
  {
    says: "the Stop hook exits 2 when a test is red and 0 when every test is green",
    test: (folder) => stopHookExit(folder, false) === 2 && stopHookExit(folder, true) === 0,
    tryNext: "the hook must run bun test, then exit 2 on a red run and 0 on a green one",
  },
] satisfies Rule[];
