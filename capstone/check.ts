// The capstone check. Run it on the folder that holds your own-feature.md:
//   bun capstone/check.ts <folder>
// It judges only what you wrote and never reads the course world. It proves the shape and that
// evidence exists: a real commit if the folder is a git repo, a test count and a review.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const HEADINGS = [
  "Repo",
  "Ticket",
  "Acceptance",
  "Evidence",
  "Review",
  "What I would change next time",
];

function sectionOf(text: string, heading: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
}

function field(section: string, label: string): string {
  const lines = section.split("\n").map((one) => one.replace(/^[-*]\s*/, ""));
  const wanted = `${label.toLowerCase()}:`;
  const line = lines.find((one) => one.toLowerCase().startsWith(wanted));
  return line?.slice(line.indexOf(":") + 1).trim() ?? "";
}

function commitExists(folder: string, commit: string): boolean {
  if (!existsSync(join(folder, ".git"))) return true;
  const run = Bun.spawnSync(["git", "cat-file", "-e", `${commit}^{commit}`], { cwd: folder });
  return run.exitCode === 0;
}

function evidenceProblems(text: string, folder: string): string[] {
  const problems: string[] = [];
  const evidence = sectionOf(text, "Evidence");
  const commit = field(evidence, "Commit");
  const isId = /^[0-9a-f]{7,40}$/.test(commit) && /\d/.test(commit) && /[a-f]/.test(commit);
  if (!isId) problems.push("the commit is not a real id: paste the short id from git log");
  else if (!commitExists(folder, commit)) problems.push("that commit is not in your repo");
  const runner = /\b(test|pytest|jest|vitest|rspec|go test|cargo test|mvn)\b/i;
  if (!runner.test(field(evidence, "Test command")))
    problems.push("name the command that ran your tests");
  if (!/\d+\s*(passed|passing|ok|tests?)\b/i.test(field(evidence, "Test result"))) {
    problems.push("paste a test result with a count, such as 14 passed");
  }
  return problems;
}

function reviewProblems(text: string): string[] {
  const problems: string[] = [];
  const review = sectionOf(text, "Review");
  if (!/\/(code-review|security-review)|reviewer/i.test(field(review, "Command"))) {
    problems.push(
      "the review command should be /code-review, /security-review or a reviewer agent",
    );
  }
  if (!/\d+\s*(found|finding)/i.test(field(review, "Findings"))) {
    problems.push("the review shows no count of findings, such as 2 found");
  }
  if (field(review, "Fixed") === "") problems.push("say what you fixed after the review");
  return problems;
}

function shapeProblems(text: string): string[] {
  const problems: string[] = [];
  const missing = HEADINGS.filter((heading) => !text.includes(`## ${heading}`));
  if (missing.length > 0) problems.push(`missing headings: ${missing.join(", ")}`);
  if (/TODO/.test(text)) problems.push("a TODO is left: write a real fact in its place");
  if (sectionOf(text, "Ticket").split(/\s+/).filter(Boolean).length < 4) {
    problems.push("the ticket should be one plain sentence");
  }
  const accept = sectionOf(text, "Acceptance").split("\n");
  if (accept.filter((line) => /\bWHEN\b/.test(line) && /\bTHEN\b/.test(line)).length < 2) {
    problems.push("two acceptance lines need WHEN and THEN");
  }
  return problems;
}

export function problemsIn(text: string, folder: string): string[] {
  return [...shapeProblems(text), ...evidenceProblems(text, folder), ...reviewProblems(text)];
}

if (import.meta.main) {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Give the folder that holds own-feature.md: bun capstone/check.ts <folder>");
    process.exit(2);
  }
  const file = join(folder, "own-feature.md");
  if (!existsSync(file)) {
    console.error(`FAIL ${file} does not exist`);
    process.exit(1);
  }
  const problems = problemsIn(readFileSync(file, "utf8"), folder);
  for (const problem of problems) console.error(`FAIL ${problem}`);
  if (problems.length > 0) process.exit(1);
  console.log("The capstone passes: your own feature has a commit, tests and a review.");
}
