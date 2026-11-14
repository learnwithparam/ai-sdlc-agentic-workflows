// ship-in-your-own-repo: one small real feature in a repo that is not Kestrel. The learner
// brings the evidence back as work/own-repo.md. This check reads that one file: the ticket, the
// criteria, a red then green test run, small commits and a review. It cannot see the other repo,
// so it checks that the file is whole, honest in shape and signed by a person.

import { approvalHolds } from "./lib/approvals";
import { fileExists, headingsOf, readFile, sectionOf } from "./lib/files";
import type { Rule } from "./lib/rule";

const FILE = "work/own-repo.md";
const HEADINGS = ["Repo", "Ticket", "Spec", "Proof", "Commits", "Review"];
const LARGEST_COMMIT = 200;
const SMALLEST_NUMBER_OF_CRITERIA = 3;

const text = (folder: string) => (fileExists(folder, FILE) ? readFile(folder, FILE) : "");
const section = (folder: string, name: string) => sectionOf(text(folder), name);

// For example "- AC-1: WHEN the user runs it THEN it prints a line".
function criteriaIn(spec: string): { id: string; line: string }[] {
  const found: { id: string; line: string }[] = [];
  for (const line of spec.split("\n")) {
    const id = line.match(/\bAC-\d+\b/)?.[0];
    if (id) found.push({ id, line });
  }
  return found;
}

function everyCriterionHasWhenAndThen(folder: string): boolean {
  const criteria = criteriaIn(section(folder, "Spec"));
  const ids = new Set(criteria.map((criterion) => criterion.id));
  return (
    ids.size >= SMALLEST_NUMBER_OF_CRITERIA &&
    criteria.every(
      (criterion) => /\bWHEN\b/.test(criterion.line) && /\bTHEN\b/.test(criterion.line),
    )
  );
}

// "2 fail" on the first commit: the tests were red before any code change.
const failedBefore = (proof: string) => {
  const red = proof.split("\n").find((line) => /^\s*[-*]\s*\**red/i.test(line)) ?? "";
  return /\b[1-9]\d*\s+fail/i.test(red) && /`[^`]+`/.test(red);
};

// "0 fail" now: the same tests are green.
const passNow = (proof: string) => {
  const green = proof.split("\n").find((line) => /^\s*[-*]\s*\**green/i.test(line)) ?? "";
  return /\b0\s+fail/i.test(green) && /\b[1-9]\d*\s+pass/i.test(green) && /`[^`]+`/.test(green);
};

type Commit = { hash: string; changed: number };

// For example "- 729c650 P-1: Add tests: 2 files changed, 107 insertions(+), 1 deletion(-)".
function commitsIn(section: string): Commit[] {
  const commits: Commit[] = [];
  for (const line of section.split("\n")) {
    const hash = line.match(/\b[0-9a-f]{7,40}\b/)?.[0];
    if (!hash || !/\bP-\d+\b/.test(line)) continue;
    const added = Number(line.match(/(\d+)\s+insertions?/)?.[1] ?? 0);
    const removed = Number(line.match(/(\d+)\s+deletions?/)?.[1] ?? 0);
    commits.push({ hash, changed: added + removed });
  }
  return commits;
}

export default [
  {
    says: `${FILE} has the six headings, in order: ${HEADINGS.join(", ")}`,
    test: (folder) => {
      const found = headingsOf(text(folder)).map((heading) => heading.toLowerCase());
      const positions = HEADINGS.map((name) => found.indexOf(name.toLowerCase()));
      const inOrder = (place: number, index: number) =>
        place >= 0 && (index === 0 || place > positions[index - 1]);
      return positions.every(inOrder);
    },
    tryNext: "ask Claude Code for the six ## headings, in that order",
  },
  {
    says: "the Ticket quotes a real number",
    test: (folder) => /\b\d+\b/.test(section(folder, "Ticket")),
    tryNext: "ask for one number from the ticket, such as how many items or users are hit",
  },
  {
    says: `the Spec has at least ${SMALLEST_NUMBER_OF_CRITERIA} criteria, each with WHEN and THEN`,
    test: everyCriterionHasWhenAndThen,
    tryNext: "write each criterion on one line: AC-1: WHEN something THEN something",
  },
  {
    says: "the Proof shows the tests red before the change, with a command and a fail count",
    test: (folder) => failedBefore(section(folder, "Proof")),
    tryNext: "run the tests on the first commit, before any code change, and paste the fail count",
  },
  {
    says: "the Proof shows the same tests green now, with a command and 0 fail",
    test: (folder) => passNow(section(folder, "Proof")),
    tryNext: "run the tests again after the last commit and paste the pass and 0 fail counts",
  },
  {
    says: "the Commits lists at least 2 commits that start with P-, each with a hash",
    test: (folder) => commitsIn(section(folder, "Commits")).length >= 2,
    tryNext: "list each commit: its hash, its subject starting P-1, and git show --shortstat",
  },
  {
    says: `no commit is over ${LARGEST_COMMIT} changed lines`,
    test: (folder) => {
      const commits = commitsIn(section(folder, "Commits"));
      return commits.length > 0 && commits.every((commit) => commit.changed <= LARGEST_COMMIT);
    },
    tryNext: "split the big commit into smaller ones, one for each plan item",
  },
  {
    says: "the Review says what the reviewer found and what you will do about it",
    test: (folder) => {
      const review = section(folder, "Review");
      const found = /\b(found|finding|no important|nothing important)\b/i.test(review);
      const acted = /\b(will|fixed|fix|changed|left)\b/i.test(review);
      return (
        review.split(/[.!?]/).filter((sentence) => sentence.trim()).length >= 2 && found && acted
      );
    },
    tryNext: "write two sentences: what the review found, and what you will do about it",
  },
  {
    says: "the tech lead approved work/own-repo.md as it is now",
    test: (folder) => approvalHolds(folder, FILE, "tech-lead"),
    tryNext: "read the file, then run: bun run approve work/own-repo.md --role tech-lead",
  },
] satisfies Rule[];
