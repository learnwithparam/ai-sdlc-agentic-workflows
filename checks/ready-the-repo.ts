// ready-the-repo: a short CLAUDE.md the team shares, AGENTS.md for every agent, and settings that
// stop Claude Code from editing the city contract even when someone tells it to.

import {
  countLines,
  fileExists,
  headingsOf,
  readFile,
  readJson,
  sectionOf,
  sha256Of,
} from "./lib/files";
import { deniedPathsOf, runsFor } from "./lib/recordings";
import type { Rule } from "./lib/rule";
import { readPermissions, ruleCovers } from "./lib/settings";
import { BASE_WORLD } from "./lib/snapshot";

const LONGEST_CLAUDE_MD = 60;
const SECTIONS = ["Commands", "Conventions", "Architecture", "Things Claude gets wrong"];
const CONTRACT = "data/contract/sla.yaml";

const claudeMd = (folder: string) => readFile(folder, "CLAUDE.md");

function packageScripts(folder: string): Record<string, string> {
  const manifest = readJson(folder, "package.json") as { scripts?: Record<string, string> };
  return manifest?.scripts ?? {};
}

// Every `bun run <name>` in the Commands section must be a real script in package.json.
function commandsAreReal(folder: string): boolean {
  const commands = sectionOf(claudeMd(folder), "Commands");
  const scripts = packageScripts(folder);
  const named = [...commands.matchAll(/bun run ([\w:-]+)/g)].map((match) => match[1]);
  const listsBoth = commands.includes("bun test") && named.includes("world");
  return listsBoth && named.every((name) => name in scripts);
}

function contractUntouched(folder: string): boolean {
  return sha256Of(readFile(folder, CONTRACT)) === sha256Of(readFile(BASE_WORLD, CONTRACT));
}

function aRunWasStoppedAtTheContract(folder: string): boolean {
  const runs = runsFor(folder, "ready-the-repo");
  return runs.some((run) => deniedPathsOf(run).some((path) => path.endsWith(CONTRACT)));
}

export default [
  {
    says: `CLAUDE.md exists and is at most ${LONGEST_CLAUDE_MD} lines`,
    test: (folder) =>
      fileExists(folder, "CLAUDE.md") && countLines(claudeMd(folder)) <= LONGEST_CLAUDE_MD,
    tryNext: "ask Claude Code to cut CLAUDE.md under 60 lines and move agent rules into AGENTS.md",
  },
  {
    says: "CLAUDE.md imports AGENTS.md with the line @AGENTS.md, and AGENTS.md exists",
    test: (folder) => /^@AGENTS\.md\s*$/m.test(claudeMd(folder)) && fileExists(folder, "AGENTS.md"),
    tryNext: "ask Claude Code to put the shared rules in AGENTS.md and add @AGENTS.md near the top",
  },
  {
    says: `CLAUDE.md has the sections ${SECTIONS.join(", ")}`,
    test: (folder) => {
      const headings = headingsOf(claudeMd(folder)).map((heading) => heading.toLowerCase());
      return SECTIONS.every((section) => headings.includes(section.toLowerCase()));
    },
    tryNext: "ask Claude Code to use exactly these four ## headings in CLAUDE.md",
  },
  {
    says: "Commands lists bun test and bun run world, and every bun run command is in package.json",
    test: commandsAreReal,
    tryNext: "ask Claude Code to list only commands that exist in package.json under ## Commands",
  },
  {
    says: ".claude/settings.json denies Edit and Write on data/contract",
    test: (folder) => {
      const deny = readPermissions(folder)?.deny ?? [];
      return (
        ruleCovers(deny, "Edit", "data/contract") && ruleCovers(deny, "Write", "data/contract")
      );
    },
    tryNext:
      "ask Claude Code to add deny rules Edit(/data/contract/**) and Write(/data/contract/**)",
  },
  {
    says: ".claude/settings.json asks a person before bun run deploy:production",
    test: (folder) => ruleCovers(readPermissions(folder)?.ask ?? [], "Bash", "deploy:production"),
    tryNext: "ask Claude Code to add an ask rule: Bash(bun run deploy:production *)",
  },
  {
    says: "a recorded run shows Claude Code stopped at the contract by a permission rule",
    test: aRunWasStoppedAtTheContract,
    tryNext: "run bun run record ready-the-repo after your settings are saved",
  },
  {
    says: "the city contract is unchanged",
    test: contractUntouched,
    tryNext: "run git checkout data/contract/sla.yaml in kestrel/, fix the deny rule, record again",
  },
] satisfies Rule[];
