// Reads a Kestrel repo's git history. Later stages are judged on order: tests before code,
// a gate before the next stage, small commits.
import { existsSync } from "node:fs";
import { join } from "node:path";

export type Commit = { hash: string; subject: string; files: string[] };

export function hasHistory(folder: string): boolean {
  return existsSync(join(folder, ".git"));
}

export function git(folder: string, gitArguments: string[]): string {
  const result = Bun.spawnSync(["git", ...gitArguments], { cwd: folder });
  return result.exitCode === 0 ? result.stdout.toString() : "";
}

// Oldest commit first, each with the files it changed.
export function commitsOf(folder: string): Commit[] {
  const log = git(folder, ["log", "--reverse", "--name-only", "--format=@@%H %s"]);
  const commits: Commit[] = [];
  for (const block of log.split("@@").filter(Boolean)) {
    const [header, ...fileLines] = block.trim().split("\n");
    const space = header.indexOf(" ");
    const files = fileLines.filter((line) => line.trim() !== "");
    commits.push({ hash: header.slice(0, space), subject: header.slice(space + 1), files });
  }
  return commits;
}
