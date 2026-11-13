// meet-kestrel: your machine is ready, and you named the stage your team skips today.

import { OLDEST_TESTED_VERSION } from "../config/claude-code";
import { isAtLeast } from "../scripts/doctor";
import { readFile } from "./lib/files";
import type { Rule } from "./lib/rule";

const STAGES = ["plan", "design", "build", "review", "release", "maintain"];

function doctorNote(folder: string): string {
  return readFile(folder, "notes/doctor.md");
}

function claudeCodeVersion(folder: string): string {
  return doctorNote(folder).match(/Claude Code: (\d+\.\d+\.\d+)/)?.[1] ?? "";
}

function goalLines(folder: string): string[] {
  const lines = readFile(folder, "notes/goal.md").split("\n");
  return lines.filter((line) => line.trim() !== "" && !line.startsWith("#"));
}

function namesOneStage(line: string): boolean {
  const words = line.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.some((word) => STAGES.includes(word));
}

export default [
  {
    says: `notes/doctor.md shows Claude Code ${OLDEST_TESTED_VERSION} or newer`,
    test: (folder) => {
      const version = claudeCodeVersion(folder);
      return version !== "" && isAtLeast(version, OLDEST_TESTED_VERSION);
    },
    tryNext: "run bun run doctor; if it says too old, run claude update and run doctor again",
  },
  {
    says: "notes/doctor.md shows Claude Code is signed in",
    test: (folder) => /Signed in: yes/.test(doctorNote(folder)),
    tryNext: "run claude, type /login, finish the sign-in, then run bun run doctor again",
  },
  {
    says: "notes/goal.md has one line that names a stage your team skips",
    test: (folder) => {
      const lines = goalLines(folder);
      return lines.length === 1 && namesOneStage(lines[0]);
    },
    tryNext: "ask Claude Code to write one line in notes/goal.md that names one stage",
  },
] satisfies Rule[];
