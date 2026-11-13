// write-the-release-notes: one change, two audiences. Riders get plain words with no ids, file
// names or jargon. Crews get the new queue order and the 48 hour clock. The product manager signs
// the notes after the tech lead signed the review rules.

import { readingGrade, sentencesOf } from "../scripts/plain-english";
import { approvalHolds, approvedInOrder } from "./lib/approvals";
import { fileExists, headingsOf, readFile, sectionOf } from "./lib/files";
import type { Rule } from "./lib/rule";

const NOTES_FILE = "work/release.md";
const HIGHEST_RIDER_GRADE = 6;

// Words a rider would have to look up. A rider sees the map in the app, not the feed behind it.
const JARGON = [
  "feed",
  "GBFS",
  "API",
  "endpoint",
  "JSON",
  "deploy",
  "SLA",
  "is_disabled",
  "commit",
  "spec",
  "acceptance",
];
const CRITERION_ID = /\b(AC|SLA|P)-\d+\b/;
const FILE_NAME = /\b[\w-]+\.(ts|md|json|ya?ml|csv)\b|\b(src|data|work|test)\//;

const notes = (folder: string) => readFile(folder, NOTES_FILE);

// The text under every heading that starts with this audience, for example "## Riders" or
// "### Crews: the queue". A title that only mentions crews in passing does not count.
function sectionFor(folder: string, audience: string): string {
  const startsWithAudience = (heading: string) => heading.toLowerCase().startsWith(audience);
  const headings = headingsOf(notes(folder)).filter(startsWithAudience);
  const sections = headings.map((heading) => sectionOf(notes(folder), heading));
  return sections.join("\n\n").trim();
}

const ridersSection = (folder: string) => sectionFor(folder, "riders");
const crewsSection = (folder: string) => sectionFor(folder, "crews");

// Each bullet is one sentence for the reading grade, so lists read the way prose does.
function riderGrade(folder: string): number {
  const text = ridersSection(folder).replace(/^\s*[-*]\s+/gm, "\n\n");
  return readingGrade(sentencesOf(text));
}

function jargonIn(text: string): string[] {
  const hasWord = (word: string) => new RegExp(`\\b${word}\\b`, "i").test(text);
  return JARGON.filter(hasWord);
}

function ridersReadPlainly(folder: string): boolean {
  const riders = ridersSection(folder);
  if (riders === "") return false;
  const hasCode = CRITERION_ID.test(riders) || FILE_NAME.test(riders);
  return !hasCode && jargonIn(riders).length === 0;
}

export default [
  {
    says: "work/release.md has a Riders section and a Crews section",
    test: (folder) =>
      fileExists(folder, NOTES_FILE) && ridersSection(folder) !== "" && crewsSection(folder) !== "",
    tryNext: "ask Claude Code for two ## sections in work/release.md: Riders and Crews",
  },
  {
    says: `the Riders section reads at grade ${HIGHEST_RIDER_GRADE} or lower`,
    test: (folder) => ridersSection(folder) !== "" && riderGrade(folder) <= HIGHEST_RIDER_GRADE,
    tryNext: "ask Claude Code to rewrite Riders in short sentences a 12-year-old can read",
  },
  {
    says: "the Riders section has no criterion ids, no file names and no jargon",
    test: ridersReadPlainly,
    tryNext: "ask Claude Code to drop ids, file names and words like feed, GBFS and deploy",
  },
  {
    says: "the Crews section says the queue puts the job due first on top",
    test: (folder) =>
      /due first|earliest first|earliest deadline|by deadline/i.test(crewsSection(folder)),
    tryNext: "ask Claude Code to tell crews that the job due first is now on top",
  },
  {
    says: "the Crews section says the 48 hour clock starts when the rider reports the bike",
    test: (folder) => {
      const crews = crewsSection(folder);
      return /48.hour/i.test(crews) && /report|wrench/i.test(crews);
    },
    tryNext: "ask Claude Code to say the 48 hour clock starts at the rider's report",
  },
  {
    says: "the product manager approved work/release.md as it is now",
    test: (folder) => approvalHolds(folder, NOTES_FILE, "pm"),
    tryNext: "read the notes, then run: bun run approve work/release.md --role pm",
  },
  {
    says: "the release notes were approved after REVIEW.md",
    test: (folder) => approvedInOrder(folder, "REVIEW.md", NOTES_FILE),
    tryNext: "start from the end of part 05: bun run start write-the-release-notes",
  },
] satisfies Rule[];
