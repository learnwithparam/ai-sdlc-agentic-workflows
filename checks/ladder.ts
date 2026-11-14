// ladder: every Claude Code feature on the L0 to L6 ladder maps to a real step with a check.
// Run it with: bun checks/ladder.ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { allSteps, ROOT, type Step } from "../scripts/structure";

type Feature = { level: string; name: string; step: string; status: "taught" | "todo" };

const REQUIRED = [
  "plan mode",
  "@ files",
  "screenshots",
  "permission modes",
  "/rewind",
  "/clear",
  "/init",
  ".claude/rules",
  "hooks",
  "deny rules",
  "sandbox",
  "skills",
  "MCP or CLI tools",
  "/goal",
  "Stop hook gate",
  "/code-review",
  "subagents",
  "worktrees",
  "/batch",
  "claude -p",
  "/loop",
  "/schedule",
  "GitHub Action",
];

function textOf(folder: string): string {
  if (!existsSync(folder)) return "";
  let text = "";
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) continue;
    if (entry.name.endsWith(".md")) text += readFileSync(path, "utf8");
  }
  const solution = join(folder, "solution", "prompts.md");
  if (existsSync(solution)) text += readFileSync(solution, "utf8");
  const problem = join(folder, "problem", "README.md");
  if (existsSync(problem)) text += readFileSync(problem, "utf8");
  return text.toLowerCase();
}

function loadFeatures(): Feature[] {
  const text = readFileSync(join(ROOT, "ladder.toml"), "utf8");
  return (Bun.TOML.parse(text) as { feature: Feature[] }).feature;
}

function featureProblems(feature: Feature, steps: Step[]): string[] {
  const step = steps.find((candidate) => candidate.name === feature.step);
  if (!step) return [`${feature.name}: step "${feature.step}" does not exist`];
  const problems: string[] = [];
  if (!existsSync(join(ROOT, "checks", `${step.name}.ts`))) {
    problems.push(`${feature.name}: step "${step.name}" has no check`);
  }
  const keyword = feature.name.replace(/ (files|rules)$/, "").toLowerCase();
  if (feature.status === "taught" && !textOf(step.dir).includes(keyword)) {
    problems.push(`${feature.name}: marked taught but "${step.name}" does not name it`);
  }
  return problems;
}

export function ladderProblems(): string[] {
  const features = loadFeatures();
  const steps = allSteps();
  const missing = REQUIRED.filter((name) => !features.some((feature) => feature.name === name));
  const unmapped = missing.map((name) => `ladder.toml has no step for "${name}"`);
  return [...unmapped, ...features.flatMap((feature) => featureProblems(feature, steps))];
}

if (import.meta.main) {
  const problems = ladderProblems();
  const features = loadFeatures();
  const todo = features.filter((feature) => feature.status === "todo").length;
  for (const problem of problems) console.log(`ladder: ${problem}`);
  console.log(`ladder: ${features.length} features mapped, ${todo} still to teach in the pages`);
  process.exit(problems.length ? 1 : 0);
}
