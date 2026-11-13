// write-the-spec: work/spec.md turns the intent into criteria a test can check, and it says no
// to the grace period out loud. The product manager signed it after the intent.

import { approvalHolds, approvedInOrder } from "./lib/approvals";
import { fileExists, readFile, sectionOf } from "./lib/files";
import type { Rule } from "./lib/rule";

const SPEC = "work/spec.md";
const INTENT = "work/intent.md";
const FEWEST_CRITERIA = 3;

const specOf = (folder: string) => readFile(folder, SPEC);

// A line that starts a criterion, such as "**AC-1**", "- **AC-1. Title**" or "### AC-1".
const CRITERION_START = /^(?:[-*]\s+)?(?:\*\*|#{1,6}\s+(?:\*\*)?)AC-\d+\b/;

// Each criterion's text: its first line up to the next criterion or heading.
// Mentions of an id inside a sentence or a table do not start a criterion.
function criteria(folder: string): string[] {
  const found: string[][] = [];
  for (const line of specOf(folder).split("\n")) {
    if (CRITERION_START.test(line)) found.push([line]);
    else if (/^#{1,6} /.test(line)) found.push([]);
    else found.at(-1)?.push(line);
  }
  const withId = found.filter((lines) => lines.length > 0 && CRITERION_START.test(lines[0]));
  return withId.map((lines) => lines.join("\n"));
}

function everyCriterionHasWhenAndThen(folder: string): boolean {
  const all = criteria(folder);
  const complete = all.filter((text) => /\bWHEN\b/.test(text) && /\bTHEN\b/.test(text));
  return all.length >= FEWEST_CRITERIA && complete.length === all.length;
}

function someCriterion(folder: string, patterns: RegExp[]): boolean {
  return criteria(folder).some((text) => patterns.every((pattern) => pattern.test(text)));
}

// A criterion that holds the bike in the feed for a while is the grace period, built anyway.
function noCriterionDelaysTheFeed(folder: string): boolean {
  return !someCriterion(folder, [/15 ?min/i]);
}

function concernsNameTheConflict(folder: string): boolean {
  const concerns = sectionOf(specOf(folder), "Concerns");
  return /grace/i.test(concerns) && concerns.includes("SLA-12");
}

export default [
  {
    says: "work/spec.md exists",
    test: (folder) => fileExists(folder, SPEC),
    tryNext: "ask Claude Code to write the spec to work/spec.md",
  },
  {
    says: `there are at least ${FEWEST_CRITERIA} criteria, each with an AC id, a WHEN and a THEN`,
    test: everyCriterionHasWhenAndThen,
    tryNext: "ask Claude Code to give every criterion an id like AC-1, a WHEN line and a THEN line",
  },
  {
    says: "one criterion says the feed shows is_disabled: true within 60 seconds",
    test: (folder) => someCriterion(folder, [/is_disabled/, /60 ?s(econd)?/i]),
    tryNext: "ask Claude Code for a criterion: the feed shows is_disabled: true within 60 seconds",
  },
  {
    says: "one criterion says the crew queue is ordered by deadline, due first",
    test: (folder) => someCriterion(folder, [/queue/i, /(order|sort)/i, /deadline/i]),
    tryNext: "ask Claude Code for a criterion: the queue is sorted by deadline, the job due first",
  },
  {
    says: "one criterion says the 48 hour deadline counts from the wrench reported_at",
    test: (folder) => someCriterion(folder, [/deadline/i, /48/, /reported_at/]),
    tryNext: "ask Claude Code for a criterion: deadline is reported_at plus 48 hours",
  },
  {
    says: "no criterion keeps a wrenched bike in the feed for 15 minutes",
    test: noCriterionDelaysTheFeed,
    tryNext: "ask Claude Code to move the grace period out of the criteria and into Concerns",
  },
  {
    says: "the Concerns section names the grace period and SLA-12",
    test: concernsNameTheConflict,
    tryNext: "ask Claude Code for a ## Concerns section: the grace period breaks SLA-12",
  },
  {
    says: "the pm approved spec.md as it is now, after the intent",
    test: (folder) => approvalHolds(folder, SPEC, "pm") && approvedInOrder(folder, INTENT, SPEC),
    tryNext: "read spec.md, then run bun run approve work/spec.md --role pm yourself",
  },
] satisfies Rule[];
