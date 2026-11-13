// bun run doctor: is this machine ready for the course?
//
// It asks Claude Code itself for its version and sign-in state. It never reads a credentials file.
// When kestrel/ exists, it saves the answer to kestrel/notes/doctor.md, so a check can read it.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { OLDEST_TESTED_VERSION } from "../config/claude-code";
import { WORKSPACE } from "./structure";

type Report = { claudeVersion: string; signedIn: boolean; bunVersion: string; worldReady: boolean };

function claudeVersion(): string {
  try {
    const result = Bun.spawnSync(["claude", "--version"]);
    const found = result.stdout.toString().match(/\d+\.\d+\.\d+/);
    return found ? found[0] : "";
  } catch {
    return "";
  }
}

// claude auth status exits 0 when signed in and 1 when not.
function claudeIsSignedIn(): boolean {
  try {
    return Bun.spawnSync(["claude", "auth", "status"]).exitCode === 0;
  } catch {
    return false;
  }
}

export function isAtLeast(version: string, oldest: string): boolean {
  const have = version.split(".").map(Number);
  const need = oldest.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (have[i] !== need[i]) return have[i] > need[i];
  }
  return true;
}

function problemsIn(report: Report): string[] {
  const problems: string[] = [];
  if (report.claudeVersion === "")
    problems.push("Claude Code is not installed. See 00-orientation.");
  else if (!isAtLeast(report.claudeVersion, OLDEST_TESTED_VERSION)) {
    problems.push(`Claude Code ${report.claudeVersion} is too old. Run: claude update`);
  }
  if (!report.signedIn) problems.push("Claude Code is not signed in. Run claude, then /login.");
  if (!report.worldReady)
    problems.push("There is no kestrel/ yet. Run: bun run start meet-kestrel");
  return problems;
}

function saveNote(report: Report) {
  if (!existsSync(WORKSPACE)) return;
  const lines = [
    "# Doctor",
    "",
    `Claude Code: ${report.claudeVersion || "not installed"}`,
    `Signed in: ${report.signedIn ? "yes" : "no"}`,
    `Bun: ${report.bunVersion}`,
    `World: ${report.worldReady ? "ready" : "missing"}`,
  ];
  mkdirSync(join(WORKSPACE, "notes"), { recursive: true });
  writeFileSync(join(WORKSPACE, "notes", "doctor.md"), `${lines.join("\n")}\n`);
}

if (import.meta.main) {
  const report: Report = {
    claudeVersion: claudeVersion(),
    signedIn: claudeIsSignedIn(),
    bunVersion: Bun.version,
    worldReady: existsSync(join(WORKSPACE, "data", "contract", "sla.yaml")),
  };
  saveNote(report);
  const problems = problemsIn(report);
  if (problems.length > 0) {
    for (const problem of problems) console.log(`doctor: ${problem}`);
    process.exit(1);
  }
  const signIn = "signed in";
  const world = "world ready";
  console.log(
    `doctor: Claude Code ${report.claudeVersion}, ${signIn}, Bun ${Bun.version}, ${world}`,
  );
}
