// bun scripts/chain-ids.ts: every sample uses the same P-1 and the same spec as Part 4.
//
// Part 3 writes the spec (AC-1 to AC-13). Part 4 plans the build, and its P-1 is the acceptance
// tests. Later parts and world/finished must name only those ids, and a spec or plan they hold
// must match. For example, a plan whose P-1 says "Disable the bike" fails here.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT } from "./structure";

const CANONICAL_SPEC = "parts/03-design-the-change/02-write-the-spec/solution/work/spec.md";
const CANONICAL_PLAN = "parts/04-build-the-change/01-plan-in-plan-mode/solution/work/plan.md";

// Samples that still use the old P-1 and the short spec, until they are recorded again from a
// real run. This list may only shrink: a file that is now consistent must leave it.
export const KNOWN_MISMATCHES = ["world/finished/work/spec.md", "world/finished/work/plan.md"];

const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const idsIn = (text: string, prefix: string) => [
  ...new Set(
    [...text.matchAll(new RegExp(`\\b${prefix}-(\\d+)\\b`, "g"))].map((found) => +found[1]),
  ),
];

// An AC id that starts a criterion: "**AC-1", "### AC-1" or "- **AC-1".
function definedCriteria(spec: string): number[] {
  const starts = [...spec.matchAll(/^(?:[-*]\s+)?(?:\*\*|#{1,6}\s+)(?:\*\*)?AC-(\d+)\b/gm)];
  return [...new Set(starts.map((start) => +start[1]))].sort((first, second) => first - second);
}

function firstPlanItemLine(plan: string): string {
  return plan.split("\n").find((line) => /^(?:[-*]\s+|#{1,6}\s+)?\**P-1\b/.test(line)) ?? "";
}

export function problemsInSample(path: string, text: string, specIds: number[], planIds: number[]) {
  const problems: string[] = [];
  const badCriteria = idsIn(text, "AC").filter((id) => !specIds.includes(id));
  if (badCriteria.length) problems.push(`names AC-${badCriteria[0]}, which Part 4's spec lacks`);
  const badItems = idsIn(text, "P").filter((id) => !planIds.includes(id));
  if (badItems.length) problems.push(`names P-${badItems[0]}, which Part 4's plan lacks`);
  if (path.endsWith("spec.md")) {
    const defined = definedCriteria(text);
    if (defined.join() !== specIds.join()) problems.push("its AC ids differ from Part 4's spec");
  }
  if (path.endsWith("plan.md") && !/test/i.test(firstPlanItemLine(text))) {
    problems.push("its P-1 is not the acceptance tests, as in Part 4");
  }
  return problems;
}

function sampleFiles(): string[] {
  const roots = ["world/finished"];
  for (const part of readdirSync(join(ROOT, "parts"))) {
    if (/^0[5-8]-/.test(part)) roots.push(`parts/${part}`);
  }
  const found: string[] = [];
  const walk = (folder: string) => {
    for (const name of readdirSync(join(ROOT, folder))) {
      const path = `${folder}/${name}`;
      if (statSync(join(ROOT, path)).isDirectory()) walk(path);
      else if (/\.(md|ts|txt)$/.test(name) && !path.includes("/wrong/")) found.push(path);
    }
  };
  for (const root of roots) if (existsSync(join(ROOT, root))) walk(root);
  return found;
}

export function chainIdProblems(): string[] {
  const specIds = definedCriteria(read(CANONICAL_SPEC));
  const planIds = idsIn(read(CANONICAL_PLAN), "P");
  const out: string[] = [];
  const mismatched = new Set<string>();
  for (const path of sampleFiles()) {
    const found = problemsInSample(path, read(path), specIds, planIds);
    if (found.length) mismatched.add(path);
    if (found.length && !KNOWN_MISMATCHES.includes(path)) out.push(`${path}: ${found[0]}`);
  }
  for (const path of KNOWN_MISMATCHES) {
    if (!mismatched.has(path)) out.push(`${path}: now consistent, remove it from KNOWN_MISMATCHES`);
  }
  return out;
}

if (import.meta.main) {
  const problems = chainIdProblems();
  for (const problem of problems) console.log(`FAIL  ${relative(ROOT, join(ROOT, problem))}`);
  if (problems.length) process.exit(1);
  console.log("Every sample uses Part 4's P-1 and spec ids.");
}
