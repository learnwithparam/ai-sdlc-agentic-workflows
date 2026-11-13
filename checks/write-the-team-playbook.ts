// write-the-team-playbook: PLAYBOOK.md says how the team works with Claude Code, and every line
// of it is true in the repo. Each gate is a real approval, each never-do item is a real deny or
// ask rule, and the size limit is the one CLAUDE.md sets.
import { type Approval, approvalHolds, readApprovals } from "./lib/approvals";
import { headingsOf, readFile, sectionOf } from "./lib/files";
import type { Rule } from "./lib/rule";
import { readPermissions } from "./lib/settings";

export const PLAYBOOK = "PLAYBOOK.md";
const DEFAULT_SIZE_LIMIT = 200;

// The words a person might write for each role id that bun run approve uses.
const ROLE_NAMES: Record<string, RegExp> = {
  pm: /\b(pm|product manager)\b/i,
  "tech-lead": /\b(tech[- ]lead)\b/i,
  qa: /\b(qa)\b/i,
  "release-manager": /\b(release[- ]manager)\b/i,
  em: /\b(em|engineering manager)\b/i,
};

const playbookOf = (folder: string) => readFile(folder, PLAYBOOK);

// The heading that contains a word, for example "stance" finds "## Our AI stance".
function sectionNamed(folder: string, word: string): string {
  const heading = headingsOf(playbookOf(folder)).find((name) => name.toLowerCase().includes(word));
  return heading ? sectionOf(playbookOf(folder), heading) : "";
}

type GateRow = { file: string; roles: string[] };

const tableCells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());

const pathOf = (text: string) => (text.match(/`([^`]+)`/)?.[1] ?? text).replace(/\/$/, "");

function gateRows(folder: string): GateRow[] {
  const lines = sectionNamed(folder, "gates").split("\n");
  const allTableLines = lines.filter((line) => line.trim().startsWith("|"));
  const tableLines = allTableLines.slice(2);
  return tableLines.map((line) => {
    const [fileCell, roleCell = ""] = tableCells(line);
    const roles = Object.keys(ROLE_NAMES).filter((role) => ROLE_NAMES[role].test(roleCell));
    return { file: pathOf(fileCell), roles };
  });
}

// Every approval except the playbook's own: the em signs the playbook after it is written.
function stageApprovals(folder: string): Approval[] {
  return readApprovals(folder).filter((approval) => approval.file !== PLAYBOOK);
}

function everyApprovalIsGate(folder: string): boolean {
  const rows = gateRows(folder);
  const approvals = stageApprovals(folder);
  const hasRow = (approval: Approval) =>
    rows.some((row) => row.file === approval.file && row.roles.includes(approval.role));
  return approvals.length > 0 && approvals.every(hasRow);
}

function everyGateIsApproval(folder: string): boolean {
  const rows = gateRows(folder);
  const approvals = stageApprovals(folder);
  const isReal = (row: GateRow) =>
    row.roles.length > 0 &&
    row.roles.every((role) => approvals.some((approval) => approval.role === role));
  return rows.length > 0 && rows.every(isReal);
}

// "data/contract/" matches "Edit(/data/contract/**)"; "bun run approve" matches its Bash rule.
function itemMatchesRule(item: string, rules: string[]): boolean {
  const names = [...item.matchAll(/`([^`]+)`/g)].map((match) =>
    match[1]
      .replace(/^\//, "")
      .replace(/\/?\*+$/, "")
      .replace(/\/$/, ""),
  );
  return names.some((name) => name.length > 2 && rules.some((rule) => rule.includes(name)));
}

function neverDoItemsAreRules(folder: string): boolean {
  const permissions = readPermissions(folder);
  const rules = [...(permissions?.deny ?? []), ...(permissions?.ask ?? [])];
  const items = sectionNamed(folder, "never")
    .split("\n")
    .filter((line) => /^\s*-\s/.test(line));
  return items.length >= 3 && items.every((item) => itemMatchesRule(item, rules));
}

export function sizeLimitOf(folder: string): number {
  const found = readFile(folder, "CLAUDE.md").match(/under (\d+) changed lines/i);
  return found ? Number(found[1]) : DEFAULT_SIZE_LIMIT;
}

function sizeLimitMatches(folder: string): boolean {
  const numbers = sectionNamed(folder, "size").match(/\d+/g) ?? [];
  return numbers.map(Number).includes(sizeLimitOf(folder));
}

export default [
  {
    says: "PLAYBOOK.md states the team's AI stance",
    test: (folder) => sectionNamed(folder, "stance").split(/\s+/).length >= 10,
    tryNext: "ask Claude Code for a short ## Our AI stance section: who writes, who signs",
  },
  {
    says: "every approval in work/approvals.jsonl has a row in the Gates table, file and role",
    test: everyApprovalIsGate,
    tryNext: "ask Claude Code to build the Gates table from work/approvals.jsonl, one row per file",
  },
  {
    says: "every row in the Gates table names a role that really approved something",
    test: everyGateIsApproval,
    tryNext: "remove gates nobody signs; a gate on paper only is not a gate",
  },
  {
    says: "every Never do item names a path or command that a deny or ask rule covers",
    test: neverDoItemsAreRules,
    tryNext: "ask Claude Code to list only what .claude/settings.json enforces, in backticks",
  },
  {
    says: "the Size of a change section uses the same limit as CLAUDE.md",
    test: sizeLimitMatches,
    tryNext: "ask Claude Code to copy the changed-lines limit from CLAUDE.md",
  },
  {
    says: "PLAYBOOK.md says when the team uses the factory, and when it does not",
    test: (folder) => sectionNamed(folder, "factory").split(/\s+/).length >= 10,
    tryNext: "ask for a ## When we use the factory section: which changes may run with no person",
  },
  {
    says: "the engineering manager approved PLAYBOOK.md as it is now",
    test: (folder) => approvalHolds(folder, PLAYBOOK, "em"),
    tryNext: "read the playbook, then run bun run approve PLAYBOOK.md --role em",
  },
] satisfies Rule[];
