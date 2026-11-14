// review-with-fresh-eyes: a reviewer subagent that cannot edit, finds the clock-change bug on the
// planted branch, and stays quiet on the clean one. Claude Code's behaviour varies from run to
// run, so it is judged on 2 of 3 recorded runs per branch. The check reads the reviews Claude
// Code wrote and the tool calls in the transcripts, never a reply.

import { join } from "node:path";
import { fileExists, readFile } from "./lib/files";
import { type ContentBlock, readRun, toolCallsOf } from "./lib/recordings";
import type { Rule } from "./lib/rule";

const AGENT_FILE = ".claude/agents/reviewer.md";
const RECORDINGS = "recordings/review-with-fresh-eyes";
const RUNS_PER_BRANCH = 3;
const RUNS_THAT_MUST_HOLD = 2;
const EDITING_TOOLS = ["Edit", "Write", "MultiEdit", "NotebookEdit"];
const QUEUE_FILES = /crew-queue|brannock-time/;
const CLOCK_CHANGE = /clock.?change|summer time|daylight|\bDST\b|\bBST\b|\bGMT\b|wall.?clock/i;
const CRITERION_ID = /\b(AC|SLA)-\d+\b/;

type Finding = { severity: string; text: string };
type BranchKind = "planted" | "clean";

// The frontmatter between the first two --- lines, as name: value pairs.
function frontmatterOf(markdown: string): Record<string, string> {
  const block = markdown.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const fields: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    const name = line.slice(0, colon).trim();
    fields[name] = line.slice(colon + 1).trim();
  }
  return fields;
}

const agentFields = (folder: string) => frontmatterOf(readFile(folder, AGENT_FILE));

// With no tools line a subagent gets every tool, Edit and Write included.
function toolsAreReadOnly(folder: string): boolean {
  const toolsLine = agentFields(folder).tools ?? "";
  const tools = toolsLine.split(/[\s,[\]"']+/).filter(Boolean);
  return tools.length > 0 && !tools.some((tool) => EDITING_TOOLS.includes(tool));
}

// One finding per table row whose Severity cell says Important or Nit.
export function findingsIn(review: string): Finding[] {
  const findings: Finding[] = [];
  for (const line of review.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const rawCells = line.split("|");
    const cells = rawCells.map((cell) => cell.replace(/[*`]/g, "").trim());
    const severity = cells.find((cell) => /^(important|nit)$/i.test(cell));
    if (severity) findings.push({ severity: severity.toLowerCase(), text: line });
  }
  return findings;
}

const importantIn = (review: string) =>
  findingsIn(review).filter((finding) => finding.severity === "important");

// For example: "Bugs | Important | src/crew-queue.ts:22 | ... summer time ... | AC-4".
function findsTheClockChange(review: string): boolean {
  const matches = (finding: Finding) =>
    QUEUE_FILES.test(finding.text) &&
    CLOCK_CHANGE.test(finding.text) &&
    CRITERION_ID.test(finding.text);
  return importantIn(review).some(matches);
}

function savedReviews(folder: string, kind: BranchKind): string[] {
  const reviews: string[] = [];
  for (let runNumber = 1; runNumber <= RUNS_PER_BRANCH; runNumber++) {
    reviews.push(readFile(folder, join(RECORDINGS, kind, `review-${runNumber}.md`)));
  }
  return reviews;
}

function savedRuns(folder: string, kind: BranchKind) {
  const runs = [];
  for (let runNumber = 1; runNumber <= RUNS_PER_BRANCH; runNumber++) {
    const path = join(RECORDINGS, kind, `run-${runNumber}.jsonl`);
    if (fileExists(folder, path)) runs.push(readRun(folder, path));
  }
  return runs;
}

const usesTheReviewer = (call: ContentBlock) =>
  ["Agent", "Task"].includes(call.name ?? "") && call.input?.subagent_type === "reviewer";

function reviewerRanIn(folder: string, kind: BranchKind): number {
  const runs = savedRuns(folder, kind);
  return runs.filter((run) => toolCallsOf(run).some(usesTheReviewer)).length;
}

const editsSource = (call: ContentBlock) =>
  EDITING_TOOLS.includes(call.name ?? "") && String(call.input?.file_path ?? "").includes("/src/");

function noRunEditedTheCode(folder: string): boolean {
  const runs = [...savedRuns(folder, "planted"), ...savedRuns(folder, "clean")];
  return runs.length > 0 && !runs.some((run) => toolCallsOf(run).some(editsSource));
}

// The cap REVIEW.md sets, for example 3 from "At most 3 nits per review".
function nitCap(folder: string): number {
  const nitLine = readFile(folder, "REVIEW.md")
    .split("\n")
    .find((line) => /\bnits?\b/i.test(line) && /\b\d+\b/.test(line));
  return Number(nitLine?.match(/\b\d+\b/)?.[0] ?? 0);
}

function nitsStayUnderTheCap(folder: string): boolean {
  const reviews = [...savedReviews(folder, "planted"), ...savedReviews(folder, "clean")];
  const countNits = (review: string) =>
    findingsIn(review).filter((finding) => finding.severity === "nit").length;
  return reviews.every((review) => countNits(review) <= nitCap(folder));
}

function quietOnTheCleanBranch(folder: string): boolean {
  const written = savedReviews(folder, "clean").filter((review) => review.trim() !== "");
  const quiet = written.filter((review) => importantIn(review).length === 0);
  return quiet.length >= RUNS_THAT_MUST_HOLD;
}

// For example: "SQL injection: src/crew-queue.ts:25 ... search ... bound parameter".
const SQL_HOLE = /sql.?injection|\bsql_injection\b/i;

function securityReports(folder: string): string[] {
  const reports: string[] = [];
  for (let runNumber = 1; runNumber <= RUNS_PER_BRANCH; runNumber++) {
    const path = join(RECORDINGS, "security", `review-${runNumber}.md`);
    if (fileExists(folder, path)) reports.push(readFile(folder, path));
  }
  return reports;
}

const findsTheSqlHole = (report: string) => SQL_HOLE.test(report) && QUEUE_FILES.test(report);

const RECORD_COMMAND = "bun parts/05-review-the-change/02-review-with-fresh-eyes/record.ts";

export default [
  {
    says: `${AGENT_FILE} has a name, a description and a tools list`,
    test: (folder) => {
      const fields = agentFields(folder);
      return fields.name === "reviewer" && Boolean(fields.description) && "tools" in fields;
    },
    tryNext: "ask Claude Code for frontmatter with name: reviewer, a description and tools",
  },
  {
    says: "the reviewer's tools are read-only: no Edit, Write or NotebookEdit",
    test: toolsAreReadOnly,
    tryNext: "ask Claude Code to set tools: Read, Grep, Glob, Bash. No tools line means all tools",
  },
  {
    says: "the reviewer reads REVIEW.md, work/spec.md and work/plan.md",
    test: (folder) => {
      const body = readFile(folder, AGENT_FILE);
      return ["REVIEW.md", "work/spec.md", "work/plan.md"].every((file) => body.includes(file));
    },
    tryNext: "ask Claude Code to name REVIEW.md, work/spec.md and work/plan.md in the body",
  },
  {
    says: "work/review.md has an Important finding on the queue, the clock change and a criterion",
    test: (folder) => findsTheClockChange(readFile(folder, "work/review.md")),
    tryNext: "ask Claude Code to use the reviewer on origin/teammate/local-deadlines again",
  },
  {
    says: "3 recorded runs on each branch, and the reviewer subagent ran in 2 of 3 of each",
    test: (folder) =>
      reviewerRanIn(folder, "planted") >= RUNS_THAT_MUST_HOLD &&
      reviewerRanIn(folder, "clean") >= RUNS_THAT_MUST_HOLD,
    tryNext: `run ${RECORD_COMMAND} after reviewer.md is saved`,
  },
  {
    says: "on the planted branch, 2 of 3 reviews find the clock-change bug as Important",
    test: (folder) =>
      savedReviews(folder, "planted").filter(findsTheClockChange).length >= RUNS_THAT_MUST_HOLD,
    tryNext: "tell the reviewer to run the Bugs pass on every time sum and cite the criterion id",
  },
  {
    says: "on the clean branch, 2 of 3 reviews have no Important finding",
    test: quietOnTheCleanBranch,
    tryNext: "point the reviewer at What Important means here in REVIEW.md, then record again",
  },
  {
    says: "on the planted-hole branch, 2 of 3 /security-review reports find the SQL injection",
    test: (folder) => securityReports(folder).filter(findsTheSqlHole).length >= RUNS_THAT_MUST_HOLD,
    tryNext: `run ${RECORD_COMMAND} again. It runs /security-review on the hole branch`,
  },
  {
    says: "every recorded review keeps nits at or under the cap in REVIEW.md",
    test: nitsStayUnderTheCap,
    tryNext: "add 'Skip style. Keep nits under the cap in REVIEW.md' to the reviewer's body",
  },
  {
    says: "no recorded run edited a file in src/",
    test: noRunEditedTheCode,
    tryNext: "a reviewer reports and never fixes: remove Edit and Write from its tools",
  },
] satisfies Rule[];
