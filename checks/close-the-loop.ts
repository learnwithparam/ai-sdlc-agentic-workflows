// close-the-loop: the incident changes how the team works. CLAUDE.md gains one line, so Claude
// does not write the same bug again. The next intent starts the lifecycle over, signed by the pm.
import { join } from "node:path";
import { findStep } from "../scripts/structure";
import { approvalHolds } from "./lib/approvals";
import { countLines, headingsOf, readFile, sectionOf } from "./lib/files";
import type { Rule } from "./lib/rule";
import { kestrelFolderFor } from "./lib/snapshot";
import { incidentNumbers, POSTMORTEM } from "./write-the-postmortem";

const LONGEST_CLAUDE_MD = 60;
const LESSONS = "Things Claude gets wrong";
const NEXT_INTENT = "work/intent/next-dedupe-wrenches.md";
const INTENT_HEADINGS = [
  "Problem",
  "Proposed outcome",
  "Affected users and systems",
  "Constraints",
  "Open questions",
];
const BEGIN_STATE = join(findStep("close-the-loop")?.dir ?? "", "problem");

const claudeMd = (folder: string) => readFile(folder, "CLAUDE.md");
const nextIntent = (folder: string) => readFile(folder, NEXT_INTENT);

function nonEmptyLines(text: string): string[] {
  return text.split("\n").filter((line) => line.trim() !== "");
}

// The lines the learner's CLAUDE.md has that the begin state's CLAUDE.md does not.
function addedLines(folder: string): string[] {
  const before = nonEmptyLines(claudeMd(kestrelFolderFor(BEGIN_STATE)));
  return nonEmptyLines(claudeMd(folder)).filter((line) => !before.includes(line));
}

function removedLines(folder: string): string[] {
  const now = nonEmptyLines(claudeMd(folder));
  const before = nonEmptyLines(claudeMd(kestrelFolderFor(BEGIN_STATE)));
  return before.filter((line) => !now.includes(line));
}

function exactlyOneNewLesson(folder: string): boolean {
  const added = addedLines(folder);
  const lessons = sectionOf(claudeMd(folder), LESSONS);
  const isUnderLessons = added.length === 1 && lessons.includes(added[0]);
  return isUnderLessons && removedLines(folder).length === 0;
}

function lessonIsAboutTheIncident(folder: string): boolean {
  const added = addedLines(folder);
  return added.length === 1 && /retr(y|ies|ied)|request_id|idempoten|twice/i.test(added[0]);
}

function intentHeadingsInOrder(folder: string): boolean {
  const headings = headingsOf(nextIntent(folder)).map((heading) => heading.toLowerCase());
  const positions = INTENT_HEADINGS.map((heading) => headings.indexOf(heading.toLowerCase()));
  const allThere = positions.every((position) => position >= 0);
  const inOrder = positions.every(
    (position, index) => index === 0 || position > positions[index - 1],
  );
  return allThere && inOrder;
}

// For example, "212 bikes" or "fell from 97.8% to 89.0%": a number the postmortem check counted.
function quotesTheIncident(folder: string): boolean {
  const numbers = incidentNumbers();
  const problem = sectionOf(nextIntent(folder), "Problem");
  const hours = Math.floor(numbers.minutes / 60);
  const minutes = numbers.minutes % 60;
  const quotes = [
    new RegExp(`\\b${numbers.bikes}\\b`),
    new RegExp(`\\b${numbers.availabilityBefore.toFixed(1).replace(".", "\\.")}\\b`),
    new RegExp(`\\b${Math.floor(numbers.availabilityLowest)}(\\.0)?%`),
    new RegExp(`\\b${hours} hours( and)? ${minutes} minutes\\b`),
  ];
  return quotes.some((quote) => quote.test(problem));
}

export default [
  {
    says: `CLAUDE.md is still at most ${LONGEST_CLAUDE_MD} lines`,
    test: (folder) => {
      const lineCount = countLines(claudeMd(folder));
      return lineCount > 0 && lineCount <= LONGEST_CLAUDE_MD;
    },
    tryNext: "ask Claude Code to keep CLAUDE.md short: one new line, nothing else",
  },
  {
    says: `CLAUDE.md gained exactly one line under ${LESSONS}, and lost none`,
    test: exactlyOneNewLesson,
    tryNext: `in kestrel/, run git checkout CLAUDE.md, then ask for one line under ## ${LESSONS}`,
  },
  {
    says: "the new line is the lesson of this incident: retries and request_id",
    test: lessonIsAboutTheIncident,
    tryNext: "ask Claude Code for the one line that would stop it writing the retry bug again",
  },
  {
    says: `${NEXT_INTENT} has the five intent headings, in order`,
    test: intentHeadingsInOrder,
    tryNext: "ask Claude Code to use the same five headings as work/intent.md, in the same order",
  },
  {
    says: "the next intent's Problem quotes a number from the postmortem's Impact",
    test: quotesTheIncident,
    tryNext: "ask Claude Code to quote a number from Impact, for example the 212 bikes",
  },
  {
    says: "the next intent has at least one open question",
    test: (folder) => /\S/.test(sectionOf(nextIntent(folder), "Open questions")),
    tryNext: "ask Claude Code to list what the team must decide before the spec",
  },
  {
    says: "the tech lead's approval of the postmortem still holds",
    test: (folder) => approvalHolds(folder, POSTMORTEM, "tech-lead"),
    tryNext: "the postmortem changed after it was signed; read it and approve it again",
  },
  {
    says: `the pm approved ${NEXT_INTENT} as it is now`,
    test: (folder) => approvalHolds(folder, NEXT_INTENT, "pm"),
    tryNext: `read the intent, then run bun run approve ${NEXT_INTENT} --role pm`,
  },
] satisfies Rule[];
