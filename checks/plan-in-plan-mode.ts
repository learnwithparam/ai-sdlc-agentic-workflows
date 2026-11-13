// plan-in-plan-mode: work/plan.md is a plan Claude Code made in plan mode, before any code.
// The tests come first, every criterion has a work item, and the tech lead signed it.

import { approvalHolds, approvedInOrder } from "./lib/approvals";
import { fileExists, headingsOf, readFile } from "./lib/files";
import { initLineOf, runsFor } from "./lib/recordings";
import type { Rule } from "./lib/rule";

const PLAN = "work/plan.md";
const SPEC = "work/spec.md";
const DECISION = "work/decisions/0001-disable-in-feed.md";
const STEP = "plan-in-plan-mode";
const HEADINGS = ["Files that change", "Order of work", "Risks", "Proof"];

// A line may name the contract only to say it stays untouched.
const SAYS_UNTOUCHED = /\b(not|no|nothing|never|untouched|read-only)\b/i;

const planOf = (folder: string) => readFile(folder, PLAN);

// The text under a ## heading, with its ### subheadings, up to the next # or ## heading.
function partOf(markdown: string, heading: string): string {
  const lines = markdown.split("\n");
  const start = lines.findIndex(
    (line) => line.trim().toLowerCase() === `## ${heading.toLowerCase()}`,
  );
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^#{1,2}\s/.test(line));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

const orderOfWork = (folder: string) => partOf(planOf(folder), "Order of work");

function hasEveryHeading(folder: string): boolean {
  const headings = headingsOf(planOf(folder)).map((heading) => heading.toLowerCase());
  return HEADINGS.every((heading) => headings.includes(heading.toLowerCase()));
}

function distinctIds(text: string, pattern: RegExp): string[] {
  return [...new Set(text.match(pattern) ?? [])];
}

function everyCriterionHasAnItem(folder: string): boolean {
  const criteria = distinctIds(readFile(folder, SPEC), /\bAC-\d+\b/g);
  const order = orderOfWork(folder);
  const covered = (id: string) => new RegExp(`\\b${id}\\b`).test(order);
  const rangeCovered = /AC-1 to AC-(\d+)/.exec(order);
  const rangeEnd = Number(rangeCovered?.[1] ?? 0);
  const inRange = (id: string) => Number(id.slice(3)) <= rangeEnd;
  return criteria.length > 0 && criteria.every((id) => covered(id) || inRange(id));
}

// The text of item P-1: from its first mention up to the first mention of P-2.
function firstItem(folder: string): string {
  const order = orderOfWork(folder);
  const start = order.search(/\bP-1\b/);
  if (start < 0) return "";
  const rest = order.slice(start);
  const next = rest.search(/\bP-2\b/);
  return next < 0 ? rest : rest.slice(0, next);
}

function contractStaysUntouched(folder: string): boolean {
  const plan = planOf(folder);
  const planned = `${partOf(plan, "Files that change")}\n${orderOfWork(folder)}`;
  const contractLines = planned.split("\n").filter((line) => line.includes("data/contract"));
  return contractLines.every((line) => SAYS_UNTOUCHED.test(line));
}

function plannedInPlanMode(folder: string): boolean {
  const runs = runsFor(folder, STEP);
  return runs.some((run) => initLineOf(run)?.permissionMode === "plan");
}

export default [
  {
    says: `${PLAN} has the headings ${HEADINGS.join(", ")}`,
    test: (folder) => fileExists(folder, PLAN) && hasEveryHeading(folder),
    tryNext: "ask Claude Code to save the approved plan to work/plan.md with the four ## headings",
  },
  {
    says: "Order of work gives each item an id: P-1, P-2 and so on",
    test: (folder) => distinctIds(orderOfWork(folder), /\bP-\d+\b/g).length >= 2,
    tryNext: "ask Claude Code to number the work items P-1, P-2 and so on",
  },
  {
    says: "every AC id in spec.md is served by a work item",
    test: everyCriterionHasAnItem,
    tryNext: "ask Claude Code which AC ids no item serves, and add an item for each",
  },
  {
    says: "P-1 is the acceptance tests in test/acceptance/, before any code",
    test: (folder) => firstItem(folder).includes("test/acceptance"),
    tryNext: "ask Claude Code to make P-1 the acceptance tests only, in test/acceptance/",
  },
  {
    says: "no work item touches data/contract/",
    test: contractStaysUntouched,
    tryNext: "ask Claude Code to take every change to data/contract/ out of the plan",
  },
  {
    says: "a recorded run shows Claude Code started in plan mode",
    test: plannedInPlanMode,
    tryNext: "run bun run record plan-in-plan-mode, which starts Claude Code in plan mode",
  },
  {
    says: "the tech-lead approved plan.md as it is now, after the decision",
    test: (folder) =>
      approvalHolds(folder, PLAN, "tech-lead") && approvedInOrder(folder, DECISION, PLAN),
    tryNext: "read plan.md, then run bun run approve work/plan.md --role tech-lead yourself",
  },
] satisfies Rule[];
