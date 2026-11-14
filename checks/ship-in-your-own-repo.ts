// ship-in-your-own-repo: the capstone. The learner ships a small feature in their own repo and
// fills work/own-feature.md. This check reads that file only, never the course world. It proves
// the shape and that the evidence looks real. It cannot open the learner's repo, so it asks for
// facts a person can look up again: a commit id, a test command and a result with a count.

import { headingsOf, readFile, sectionOf } from "./lib/files";
import type { Rule } from "./lib/rule";

const FILE = "work/own-feature.md";
const HEADINGS = ["Repo", "Ticket", "Acceptance", "Evidence", "What I would change next time"];
const WORLD_WORDS = /\b(kestrel|bike|bikes|wrench|wrenched|wrenches|crew|crews|rider|riders)\b/i;

const text = (folder: string) => readFile(folder, FILE);
const evidenceLine = (folder: string, label: string) =>
  sectionOf(text(folder), "Evidence")
    .split("\n")
    .find((line) =>
      line
        .replace(/^[-*]\s*/, "")
        .toLowerCase()
        .startsWith(label.toLowerCase()),
    )
    ?.replace(/^[-*]\s*[^:]+:\s*/, "")
    .trim() ?? "";

export default [
  {
    says: "work/own-feature.md has every heading of the template",
    test: (folder) => {
      const found = headingsOf(text(folder));
      return HEADINGS.every((heading) => found.includes(heading));
    },
    tryNext: "start again with bun run start ship-in-your-own-repo to get the template",
  },
  {
    says: "no TODO is left in the file",
    test: (folder) => text(folder) !== "" && !/TODO/.test(text(folder)),
    tryNext: "replace each TODO with a real fact from your own repo",
  },
  {
    says: "the ticket is one sentence of at least 4 words",
    test: (folder) => sectionOf(text(folder), "Ticket").split(/\s+/).filter(Boolean).length >= 4,
    tryNext: "write the feature you shipped in one plain sentence",
  },
  {
    says: "two acceptance lines each have WHEN and THEN",
    test: (folder) => {
      const lines = sectionOf(text(folder), "Acceptance").split("\n");
      return lines.filter((line) => /\bWHEN\b/.test(line) && /\bTHEN\b/.test(line)).length >= 2;
    },
    tryNext: "write two lines like: AC-1: WHEN a user does this, THEN this happens",
  },
  {
    says: "the commit is a real id: 7 to 40 hex characters with a digit and a letter",
    test: (folder) => {
      const commit = evidenceLine(folder, "Commit");
      return /^[0-9a-f]{7,40}$/.test(commit) && /\d/.test(commit) && /[a-f]/.test(commit);
    },
    tryNext: "run git log --oneline -1 in your own repo and paste the short id",
  },
  {
    says: "the test command is named, for example npm test or pytest",
    test: (folder) =>
      /\b(test|pytest|jest|vitest|rspec|go test|cargo test|mvn)\b/i.test(
        evidenceLine(folder, "Test command"),
      ),
    tryNext: "paste the exact command you ran to run the tests",
  },
  {
    says: "the test result shows a count, for example 14 passed",
    test: (folder) =>
      /\d+\s*(passed|passing|ok|tests?)\b/i.test(evidenceLine(folder, "Test result")),
    tryNext: "paste the line your test tool prints, such as 14 passed, 0 failed",
  },
  {
    says: "no line comes from the course world: no bikes, wrenches, crews or Kestrel",
    test: (folder) => text(folder) !== "" && !WORLD_WORDS.test(text(folder)),
    tryNext: "describe your own repo and feature, not the course example",
  },
] satisfies Rule[];
