// write-the-contract-skill: the city contract as a project skill, with a description that makes
// Claude Code load it while it writes a spec. Recorded runs show it loads in 2 of 3 runs.

import { fileExists, readFile } from "./lib/files";
import { initLineOf, type RunLine, runsFor, toolCallsOf } from "./lib/recordings";
import type { Rule } from "./lib/rule";

const SKILL_NAME = "city-contract";
const SKILL_FILE = `.claude/skills/${SKILL_NAME}/SKILL.md`;
const STEP = "write-the-contract-skill";
const RUNS_NEEDED = 2;

const skillOf = (folder: string) => readFile(folder, SKILL_FILE);

// The lines between the first two --- lines, as name and value pairs.
function frontmatterOf(folder: string): Record<string, string> {
  const blocks = skillOf(folder).split(/^---\s*$/m);
  const fields: Record<string, string> = {};
  if (blocks.length < 3) return fields;
  for (const line of blocks[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const field = line.slice(0, colon).trim();
    fields[field] = line.slice(colon + 1).trim();
  }
  return fields;
}

// Everything after the frontmatter: the rules Claude Code reads once the skill loads.
function bodyOf(folder: string): string {
  const blocks = skillOf(folder).split(/^---\s*$/m);
  return blocks.slice(2).join("---");
}

// Claude Code loads a skill when its description matches the job, so it must name the job.
function descriptionSaysWhen(folder: string): boolean {
  const description = (frontmatterOf(folder).description ?? "").toLowerCase();
  const namesAnArea = ["wrench", "feed", "queue"].some((area) => description.includes(area));
  return description.includes("use") && description.includes("spec") && namesAnArea;
}

function usedTheSkill(run: RunLine[]): boolean {
  const listed = initLineOf(run)?.skills?.includes(SKILL_NAME) ?? false;
  const calls = toolCallsOf(run).filter((call) => call.name === "Skill");
  const called = calls.some((call) => call.input?.skill === SKILL_NAME);
  return listed && called;
}

function bodyRule(says: string, pattern: RegExp, tryNext: string): Rule {
  return {
    says: `the skill says ${says}`,
    test: (folder) => pattern.test(bodyOf(folder)),
    tryNext,
  };
}

export default [
  {
    says: `${SKILL_FILE} exists with name: ${SKILL_NAME}`,
    test: (folder) => fileExists(folder, SKILL_FILE) && frontmatterOf(folder).name === SKILL_NAME,
    tryNext: "ask Claude Code to write the skill with name: city-contract in its frontmatter",
  },
  {
    says: "the description says when to use it: writing a spec for wrenches, the feed or the queue",
    test: descriptionSaysWhen,
    tryNext: "ask Claude Code for a description that starts 'Use whenever you write a spec...'",
  },
  bodyRule(
    "the 48 hour clock starts at the wrench",
    /(?=[\s\S]*\b48\b)[\s\S]*start[^\n]*(wrench|reported_at)/i,
    "ask Claude Code to add: the 48 hour clock starts at the wrench, not when the job opens",
  ),
  bodyRule(
    "a defect a crew finds gets 96 hours",
    /96/,
    "ask Claude Code to add the 96 hour rule for defects a crew finds itself",
  ),
  bodyRule(
    "a wrenched bike shows is_disabled: true within 60 seconds",
    /is_disabled[^\n]*60 seconds|60 seconds[^\n]*is_disabled/i,
    "ask Claude Code to add the feed rule: is_disabled: true within 60 seconds",
  ),
  bodyRule(
    "never edit data/contract/sla.yaml",
    /sla\.yaml[\s\S]*never edit|never edit[\s\S]*sla\.yaml/i,
    "ask Claude Code to add: never edit data/contract/sla.yaml",
  ),
  bodyRule(
    "what to do on a conflict: write it down and ask the product manager",
    /conflict[\s\S]*product manager/i,
    "ask Claude Code to add: on a conflict, do not build it, write it down, ask the pm",
  ),
  {
    says: `in ${RUNS_NEEDED} of 3 recorded runs, Claude Code lists the skill and uses it`,
    test: (folder) => runsFor(folder, STEP).filter(usedTheSkill).length >= RUNS_NEEDED,
    tryNext: "run bun run record write-the-contract-skill three times after the skill is saved",
  },
] satisfies Rule[];
