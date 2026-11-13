// capture-the-intent: work/intent.md says what should change and why, in the team's five
// headings, with numbers from the findings, and the product manager signed it as it is now.

import { approvalHolds } from "./lib/approvals";
import { fileExists, headingsOf, readFile, sectionOf } from "./lib/files";
import type { Rule } from "./lib/rule";

const INTENT = "work/intent.md";
const FINDINGS = "work/findings.md";
const CONTRACT = "data/contract/sla.yaml";
const HEADINGS = [
  "Problem",
  "Proposed outcome",
  "Affected users and systems",
  "Constraints",
  "Open questions",
];

const intentOf = (folder: string) => readFile(folder, INTENT);

// True when the five headings are there and come in the team's order.
function headingsInOrder(folder: string): boolean {
  const headings = headingsOf(intentOf(folder)).map((heading) => heading.toLowerCase());
  const positions = HEADINGS.map((heading) => headings.indexOf(heading.toLowerCase()));
  const allThere = positions.every((position) => position >= 0);
  return (
    allThere && positions.every((position, index) => index === 0 || position > positions[index - 1])
  );
}

// Numbers such as "8.9%", "118" or "£5,900", written the same way in both files.
function numbersIn(text: string): Set<string> {
  const matches = text.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  return new Set(matches.map((number) => number.replaceAll(",", "")));
}

// The contract's own numbers (48 hours, 95%) do not count: they are not findings.
function numbersFromFindings(folder: string): string[] {
  const inProblem = numbersIn(sectionOf(intentOf(folder), "Problem"));
  const inFindings = numbersIn(readFile(folder, FINDINGS));
  const inContract = numbersIn(readFile(folder, CONTRACT));
  const shared = [...inProblem].filter((number) => inFindings.has(number));
  return shared.filter((number) => !inContract.has(number));
}

function asksQuestions(folder: string): boolean {
  return sectionOf(intentOf(folder), "Open questions").includes("?");
}

export default [
  {
    says: "work/intent.md exists",
    test: (folder) => fileExists(folder, INTENT),
    tryNext: "ask Claude Code to write the intent to work/intent.md",
  },
  {
    says: "intent.md has the five headings, in order",
    test: headingsInOrder,
    tryNext: "ask Claude Code to use exactly these five ## headings, in this order",
  },
  {
    says: "Problem quotes two numbers from work/findings.md",
    test: (folder) => numbersFromFindings(folder).length >= 2,
    tryNext:
      "ask Claude Code to quote two numbers from findings.md under Problem, as written there",
  },
  {
    says: `Constraints names ${CONTRACT}`,
    test: (folder) => sectionOf(intentOf(folder), "Constraints").includes(CONTRACT),
    tryNext: "ask Claude Code to name data/contract/sla.yaml under Constraints",
  },
  {
    says: "Open questions asks at least one question",
    test: asksQuestions,
    tryNext: "ask Claude Code to list what is still unknown under Open questions, as questions",
  },
  {
    says: "the pm approved intent.md as it is now",
    test: (folder) => approvalHolds(folder, INTENT, "pm"),
    tryNext: "read intent.md, then run bun run approve work/intent.md --role pm yourself",
  },
] satisfies Rule[];
