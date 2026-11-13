// Reads the repo layout once. Every other script asks this file where things are.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const ROOT = join(import.meta.dir, "..");
export const ORIENTATION_FOLDER = "00-orientation";

// The learner's own Kestrel repo. Claude Code runs inside it; the course never commits it.
export const WORKSPACE = join(ROOT, "kestrel");

// Folders no course script reads as course content.
export const NOT_COURSE_CONTENT = new Set([
  "node_modules",
  ".git",
  ".venv",
  "kestrel",
  ".kestrel-backups",
  ".finished-run",
]);

export type Step = {
  name: string; // verb-the-thing, also the command argument
  dir: string;
  part: string;
  meta: { minutes: number; screen: boolean; solution: boolean };
};
export type Part = { name: string; dir: string; steps: Step[] };

type StepSettings = { minutes?: number; screen?: boolean; solution?: boolean };

function subfolders(folder: string): string[] {
  if (!existsSync(folder)) return [];
  const entries = readdirSync(folder);
  const folders = entries.filter((entry) => statSync(join(folder, entry)).isDirectory());
  return folders.sort();
}

// Folders keep an order prefix for sorting only. Learners never type it.
export const bareName = (folder: string) => folder.replace(/^\d+-/, "");

function readSettings(stepFolder: string): StepSettings {
  const settingsPath = join(stepFolder, "step.toml");
  if (!existsSync(settingsPath)) return {};
  return Bun.TOML.parse(readFileSync(settingsPath, "utf8")) as StepSettings;
}

function loadStep(partFolder: string, partName: string, stepName: string): Step {
  const stepFolder = join(partFolder, stepName);
  const settings = readSettings(stepFolder);
  return {
    name: bareName(stepName),
    dir: stepFolder,
    part: bareName(partName),
    meta: {
      minutes: Number(settings.minutes ?? 0),
      screen: Boolean(settings.screen),
      solution: Boolean(settings.solution),
    },
  };
}

// A step folder is any folder that holds a step.toml, so images/ and notes stay out.
function loadSteps(partFolder: string, partName: string): Step[] {
  const stepFolders = subfolders(partFolder).filter((folder) =>
    existsSync(join(partFolder, folder, "step.toml")),
  );
  return stepFolders.map((stepName) => loadStep(partFolder, partName, stepName));
}

// The orientation is the first part. Its README lives at the root, so learners find it first.
function orientationPart(): Part[] {
  const folder = join(ROOT, ORIENTATION_FOLDER);
  if (!existsSync(folder)) return [];
  return [{ name: "orientation", dir: folder, steps: loadSteps(folder, "orientation") }];
}

export function parts(): Part[] {
  const partsFolder = join(ROOT, "parts");
  const courseParts = subfolders(partsFolder).map((partName) => {
    const partFolder = join(partsFolder, partName);
    return { name: bareName(partName), dir: partFolder, steps: loadSteps(partFolder, partName) };
  });
  return [...orientationPart(), ...courseParts];
}

export const allSteps = () => parts().flatMap((part) => part.steps);

export function findStep(name: string): Step | undefined {
  return allSteps().find((step) => step.name === name);
}
