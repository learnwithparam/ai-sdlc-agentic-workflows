// record-the-decision: the choice behind AC-1, written down so nobody argues it again later.
// Two options, one chosen for a reason the GBFS reference backs, and an honest cost.

import { approvalHolds, approvedInOrder } from "./lib/approvals";
import { fileExists, headingsOf, readFile, sectionOf } from "./lib/files";
import type { Rule } from "./lib/rule";

const DECISION = "work/decisions/0001-disable-in-feed.md";
const SPEC = "work/spec.md";
const HEADINGS = [
  "Context and Problem Statement",
  "Considered Options",
  "Decision Outcome",
  "Consequences",
];

// Words from the GBFS v3 reference for is_disabled. A made-up quote will not have them.
const GBFS_TEXT = /not available for rental|due to a mechanical issue/i;

const decisionOf = (folder: string) => readFile(folder, DECISION);
const sectionText = (folder: string, heading: string) => sectionOf(decisionOf(folder), heading);

function hasEveryHeading(folder: string): boolean {
  const headings = headingsOf(decisionOf(folder)).map((heading) => heading.toLowerCase());
  return HEADINGS.every((heading) => headings.includes(heading.toLowerCase()));
}

// The options are the list items under Considered Options, such as "1. ..." or "- ...".
function optionsOf(folder: string): string[] {
  const lines = sectionText(folder, "Considered Options").split("\n");
  return lines.filter((line) => /^\s*([-*]|\d+[.)])\s/.test(line));
}

function weighsBothWays(folder: string): boolean {
  const options = optionsOf(folder);
  const markIt = options.some((option) => option.includes("is_disabled"));
  const dropIt = options.some((option) => /\b(drop|remove|hide)/i.test(option));
  return options.length >= 2 && markIt && dropIt;
}

export default [
  {
    says: `${DECISION} exists`,
    test: (folder) => fileExists(folder, DECISION),
    tryNext:
      "ask Claude Code to write the decision record to work/decisions/0001-disable-in-feed.md",
  },
  {
    says: "it has the MADR headings: Context and Problem Statement, Considered Options, ...",
    test: hasEveryHeading,
    tryNext: "ask Claude Code to use the four MADR headings, as ## headings",
  },
  {
    says: "Considered Options lists two options: mark is_disabled, and drop the bike",
    test: weighsBothWays,
    tryNext:
      "ask Claude Code to list both options: mark is_disabled, or drop the bike from the feed",
  },
  {
    says: 'Decision Outcome starts its choice with "Chosen option"',
    test: (folder) => sectionText(folder, "Decision Outcome").includes("Chosen option"),
    tryNext: 'ask Claude Code to start the outcome with "Chosen option:" and name one option',
  },
  {
    says: "the reason quotes the GBFS reference text for is_disabled",
    test: (folder) => GBFS_TEXT.test(sectionText(folder, "Decision Outcome")),
    tryNext: "copy the is_disabled text from the GBFS reference into your prompt, and ask for it",
  },
  {
    says: 'Consequences has at least one "Bad, because"',
    test: (folder) => sectionText(folder, "Consequences").includes("Bad, because"),
    tryNext: 'ask Claude Code to add what the choice costs, as a "Bad, because" line',
  },
  {
    says: "the tech-lead approved the decision as it is now, after the spec",
    test: (folder) =>
      approvalHolds(folder, DECISION, "tech-lead") && approvedInOrder(folder, SPEC, DECISION),
    tryNext: `read the record, then run bun run approve ${DECISION} --role tech-lead`,
  },
] satisfies Rule[];
