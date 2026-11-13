// A check always looks at a whole Kestrel repo.
//
// The learner's repo is kestrel/. A step's problem/, solution/ and wrong/ folders hold only the
// files that differ from the world's begin state in world/kestrel/, the way a LinkedIn Learning
// exercise branch overlays files from main. This file lays one over the other in a temporary
// folder, so every check reads a full repo either way.
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { ROOT, WORKSPACE } from "../../scripts/structure";

export const BASE_WORLD = join(ROOT, "world", "kestrel");

// Course files that sit in a snapshot folder but are not part of Kestrel's repo.
const COURSE_ONLY_FILES = new Set(["README.md", "prompts.md", "images", "history.bundle"]);

const builtFolders = new Map<string, string>();
const temporaryFolders: string[] = [];

process.on("exit", () => {
  for (const folder of temporaryFolders) rmSync(folder, { recursive: true, force: true });
});

export function isSnapshot(folder: string): boolean {
  const path = relative(ROOT, folder);
  return !path.startsWith("..") && folder !== WORKSPACE && !path.startsWith("kestrel");
}

// Copies the snapshot's own files over a base, skipping the step's course files.
export function overlay(snapshot: string, target: string) {
  for (const entry of readdirSync(snapshot)) {
    if (COURSE_ONLY_FILES.has(entry)) continue;
    cpSync(join(snapshot, entry), join(target, entry), { recursive: true });
  }
}

function startingPoint(snapshot: string, target: string) {
  const bundle = join(snapshot, "history.bundle");
  if (!existsSync(bundle)) {
    cpSync(BASE_WORLD, target, { recursive: true });
    return;
  }
  // A snapshot whose check reads git history ships that history as a git bundle.
  rmSync(target, { recursive: true, force: true });
  Bun.spawnSync(["git", "clone", "--quiet", bundle, target]);
}

export function buildSnapshot(snapshot: string): string {
  const target = mkdtempSync(join(tmpdir(), "kestrel-snapshot-"));
  temporaryFolders.push(target);
  startingPoint(snapshot, target);
  overlay(snapshot, target);
  return target;
}

// The folder a check should read: the learner's repo as it is, or a snapshot laid over the base.
export function kestrelFolderFor(folder: string): string {
  if (!isSnapshot(folder)) return folder;
  const alreadyBuilt = builtFolders.get(folder);
  if (alreadyBuilt) return alreadyBuilt;
  const built = buildSnapshot(folder);
  builtFolders.set(folder, built);
  return built;
}
