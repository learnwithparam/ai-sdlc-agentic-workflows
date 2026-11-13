// write-the-review-rules: REVIEW.md tells every reviewer what to look for and what to leave out.
// Three passes, a plain meaning for Important, a cap on nits, and a list of things not to report.
// The tech lead signs it, after QA signed the acceptance tests.

import { approvalHolds, approvedInOrder } from "./lib/approvals";
import { fileExists, headingsOf, readFile, sectionOf } from "./lib/files";
import type { Rule } from "./lib/rule";

const RULES_FILE = "REVIEW.md";
const PASSES = ["Bugs", "Security", "Compliance"];

const reviewRules = (folder: string) => readFile(folder, RULES_FILE);

// The first heading that contains these words, for example "What Important means here".
function headingWith(folder: string, words: RegExp): string {
  const headings = headingsOf(reviewRules(folder));
  return headings.find((heading) => words.test(heading)) ?? "";
}

function sectionWith(folder: string, words: RegExp): string {
  const heading = headingWith(folder, words);
  if (heading === "") return "";
  return sectionOf(reviewRules(folder), heading);
}

function hasEveryPass(folder: string): boolean {
  const headings = headingsOf(reviewRules(folder)).map((heading) => heading.toLowerCase());
  const hasPass = (pass: string) =>
    headings.some((heading) => heading.includes(pass.toLowerCase()));
  return PASSES.every(hasPass);
}

// For example, "At most 3 nits per review." A cap needs a number, not "keep nits few".
function capsNits(folder: string): boolean {
  const lines = reviewRules(folder).split("\n");
  const nitLines = lines.filter((line) => /\bnits?\b/i.test(line));
  return nitLines.some((line) => /\b\d+\b/.test(line));
}

export default [
  {
    says: "REVIEW.md exists at the root of kestrel/",
    test: (folder) => fileExists(folder, RULES_FILE),
    tryNext: "ask Claude Code to write REVIEW.md at the root of the repo, next to CLAUDE.md",
  },
  {
    says: `REVIEW.md has a heading for each pass: ${PASSES.join(", ")}`,
    test: hasEveryPass,
    tryNext: "ask Claude Code for one ## section per pass: Bugs, Security, Compliance",
  },
  {
    says: "the Compliance pass checks the change against work/spec.md and work/plan.md",
    test: (folder) => {
      const compliance = sectionWith(folder, /compliance/i);
      return compliance.includes("work/spec.md") && compliance.includes("work/plan.md");
    },
    tryNext: "ask Claude Code to name work/spec.md and work/plan.md under Compliance",
  },
  {
    says: "REVIEW.md says what Important means here, under its own heading",
    test: (folder) => sectionWith(folder, /important/i).length > 0,
    tryNext: "ask for a section What Important means here: who would feel the problem",
  },
  {
    says: "REVIEW.md caps nits with a number, for example at most 3",
    test: capsNits,
    tryNext: "ask Claude Code to add a Nits section that allows at most 3 nits per review",
  },
  {
    says: "a Do not report list names data/",
    test: (folder) => sectionWith(folder, /not report/i).includes("data/"),
    tryNext: "ask for a section Do not report that lists data/, the recorded data",
  },
  {
    says: "the tech lead approved REVIEW.md as it is now",
    test: (folder) => approvalHolds(folder, RULES_FILE, "tech-lead"),
    tryNext: "read REVIEW.md, then run: bun run approve REVIEW.md --role tech-lead",
  },
  {
    says: "REVIEW.md was approved after QA approved test/acceptance",
    test: (folder) => approvedInOrder(folder, "test/acceptance", RULES_FILE),
    tryNext: "start from the end of part 04: bun run start write-the-review-rules",
  },
] satisfies Rule[];
