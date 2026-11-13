// bun parts/07-learn-from-the-incident/make-begin-history.ts <output-folder>
//
// For course authors. It builds the Kestrel repo as it stands when Part 7 begins: every stage
// from Part 1 to Part 6 committed in order, each gate signed by the right person, and the North
// incident logs added. The files come from world/finished/ and its recorded build history.
// The step's problem/history.bundle is made from this repo with git bundle create.
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { contentHash } from "../../checks/lib/files";
import { BASE_WORLD } from "../../checks/lib/snapshot";
import { ROOT } from "../../scripts/structure";

const FINISHED = join(ROOT, "world", "finished");
const INCIDENT_LOGS = join(ROOT, "world", "incidents", "north-double-wrench");
const CLAUDE_TRAILER = "Co-Authored-By: Claude <noreply@anthropic.com>";

// The build commits P-1 to P-3 come from the recorded build run in world/finished/history.bundle.
const BUILD_COMMITS = [
  { subject: "P-1: disable the bike when a wrench arrives", search: "^P-1:" },
  { subject: "P-2: start the deadline clock at the wrench reported_at", search: "^P-2:" },
  { subject: "P-3: sort the crew queue by deadline, due first", search: "^P-3:" },
];

const PEOPLE: Record<string, string> = {
  learner: "Kestrel learner",
  pm: "Theo Lindqvist",
  "tech-lead": "Ines Moreau",
  qa: "Raj Patel",
  "release-manager": "Mei Tanaka",
};

type Commit = { at: string; files: string[]; message: string; who?: string; byClaude?: boolean };

function git(folder: string, words: string[], environment: Record<string, string> = {}): string {
  const result = Bun.spawnSync(["git", ...words], {
    cwd: folder,
    env: { ...process.env, ...environment },
  });
  if (result.exitCode !== 0) throw new Error(`git ${words.join(" ")}: ${result.stderr}`);
  return result.stdout.toString();
}

function commitAs(folder: string, commit: Commit) {
  const name = PEOPLE[commit.who ?? "learner"];
  const email = `${name.toLowerCase().replaceAll(" ", ".")}@kestrel.example`;
  const environment = {
    GIT_AUTHOR_NAME: name,
    GIT_AUTHOR_EMAIL: email,
    GIT_COMMITTER_NAME: name,
    GIT_COMMITTER_EMAIL: email,
    GIT_AUTHOR_DATE: commit.at,
    GIT_COMMITTER_DATE: commit.at,
  };
  const trailer = commit.byClaude ? `\n\n${CLAUDE_TRAILER}` : "";
  git(folder, ["add", "--all", ...commit.files]);
  git(folder, ["commit", "--quiet", "--message", `${commit.message}${trailer}`], environment);
}

function copyFromFinished(folder: string, path: string) {
  mkdirSync(dirname(join(folder, path)), { recursive: true });
  cpSync(join(FINISHED, path), join(folder, path), { recursive: true });
}

// The finished CLAUDE.md already holds the line Part 7 adds. Part 7 begins without it.
function claudeMdBeforeTheIncident(): string {
  const lines = readFileSync(join(FINISHED, "CLAUDE.md"), "utf8").split("\n");
  return lines.filter((line) => !line.includes("request_id")).join("\n");
}

// The finished plan.md has P-4, which comes from the postmortem. The approved plan did not.
function planBeforeTheIncident(): string {
  const lines = readFileSync(join(FINISHED, "work", "plan.md"), "utf8").split("\n");
  const kept = lines.filter((line) => !line.includes("P-4"));
  const plan = kept.join("\n").replace("- `src/database.ts`\n", "");
  return plan.replace(" and `test/regression/`", "");
}

function approve(folder: string, file: string, role: string, signedAt: string) {
  const sha256 = contentHash(folder, file);
  const approval = { file, sha256, role, at: signedAt, by: PEOPLE[role] };
  mkdirSync(join(folder, "work"), { recursive: true });
  appendFileSync(join(folder, "work", "approvals.jsonl"), `${JSON.stringify(approval)}\n`);
  const message = `approve: ${file} by ${role}`;
  commitAs(folder, { at: signedAt, files: [file, "work/approvals.jsonl"], message, who: role });
}

function startRepo(folder: string) {
  cpSync(BASE_WORLD, folder, { recursive: true });
  git(folder, ["init", "--quiet", "--initial-branch=main"]);
  commitAs(folder, { at: "2026-10-26T09:00:00Z", files: [], message: "Kestrel spoke as it was" });
}

function readyTheRepo(folder: string) {
  writeFileSync(join(folder, "CLAUDE.md"), claudeMdBeforeTheIncident());
  copyFromFinished(folder, "AGENTS.md");
  copyFromFinished(folder, ".claude/settings.json");
  commitAs(folder, {
    at: "2026-10-26T10:30:00Z",
    files: [],
    message: "Add CLAUDE.md, AGENTS.md and the team's Claude Code settings",
    byClaude: true,
  });
}

function planTheChange(folder: string) {
  copyFromFinished(folder, "work/findings.md");
  const findingsMessage = "Find the real cause of late repairs in data/";
  commitAs(folder, {
    at: "2026-10-27T10:00:00Z",
    files: [],
    message: findingsMessage,
    byClaude: true,
  });
  copyFromFinished(folder, "work/intent.md");
  const intentMessage = "Write the intent: wrenched bikes leave the feed";
  commitAs(folder, {
    at: "2026-10-27T11:30:00Z",
    files: [],
    message: intentMessage,
    byClaude: true,
  });
  approve(folder, "work/intent.md", "pm", "2026-10-27T14:00:00Z");
}

function designTheChange(folder: string) {
  copyFromFinished(folder, ".claude/skills/city-contract/SKILL.md");
  const skillMessage = "Add the city-contract skill";
  commitAs(folder, {
    at: "2026-10-28T10:00:00Z",
    files: [],
    message: skillMessage,
    byClaude: true,
  });
  copyFromFinished(folder, "work/spec.md");
  const specMessage = "Write the spec with AC-1 to AC-4";
  commitAs(folder, { at: "2026-10-28T15:00:00Z", files: [], message: specMessage, byClaude: true });
  approve(folder, "work/spec.md", "pm", "2026-10-28T16:00:00Z");
  const decision = "work/decisions/0001-disable-in-feed.md";
  copyFromFinished(folder, decision);
  const decisionMessage = "Record the decision: disable in the feed, no grace period";
  commitAs(folder, {
    at: "2026-10-29T09:30:00Z",
    files: [],
    message: decisionMessage,
    byClaude: true,
  });
  approve(folder, decision, "tech-lead", "2026-10-29T10:30:00Z");
}

function buildCommitFiles(folder: string, search: string) {
  const finishedHistory = mkdtempSync(join(tmpdir(), "finished-history-"));
  rmSync(finishedHistory, { recursive: true, force: true });
  git(ROOT, ["clone", "--quiet", join(FINISHED, "history.bundle"), finishedHistory]);
  const hash = git(finishedHistory, ["log", "--format=%H", `--grep=${search}`]).trim();
  git(finishedHistory, ["checkout", "--quiet", hash]);
  rmSync(join(folder, "src"), { recursive: true, force: true });
  cpSync(join(finishedHistory, "src"), join(folder, "src"), { recursive: true });
  rmSync(finishedHistory, { recursive: true, force: true });
}

function buildTheChange(folder: string) {
  writeFileSync(join(folder, "work", "plan.md"), planBeforeTheIncident());
  const planMessage = "Write the plan in plan mode: P-1 to P-3";
  commitAs(folder, { at: "2026-10-29T13:00:00Z", files: [], message: planMessage, byClaude: true });
  approve(folder, "work/plan.md", "tech-lead", "2026-10-29T14:00:00Z");
  copyFromFinished(folder, "test/acceptance");
  const testsMessage = "Add one failing acceptance test per criterion";
  commitAs(folder, {
    at: "2026-10-30T09:00:00Z",
    files: [],
    message: testsMessage,
    byClaude: true,
  });
  approve(folder, "test/acceptance", "qa", "2026-10-30T10:00:00Z");
  const times = ["2026-10-30T11:00:00Z", "2026-10-30T13:30:00Z", "2026-10-30T15:00:00Z"];
  BUILD_COMMITS.forEach((build, index) => {
    buildCommitFiles(folder, build.search);
    commitAs(folder, { at: times[index], files: [], message: build.subject, byClaude: true });
  });
}

function reviewTheChange(folder: string) {
  copyFromFinished(folder, "REVIEW.md");
  copyFromFinished(folder, ".claude/agents/reviewer.md");
  const rulesMessage = "Write REVIEW.md and the read-only reviewer";
  commitAs(folder, {
    at: "2026-10-31T09:00:00Z",
    files: [],
    message: rulesMessage,
    byClaude: true,
  });
  approve(folder, "REVIEW.md", "tech-lead", "2026-10-31T10:00:00Z");
  copyFromFinished(folder, "work/review.md");
  const reviewMessage = "Review the build with fresh eyes";
  commitAs(folder, {
    at: "2026-10-31T11:00:00Z",
    files: [],
    message: reviewMessage,
    byClaude: true,
  });
}

function releaseTheChange(folder: string) {
  copyFromFinished(folder, "work/release.md");
  const notesMessage = "Write the release notes for riders and crews";
  commitAs(folder, {
    at: "2026-11-01T10:00:00Z",
    files: [],
    message: notesMessage,
    byClaude: true,
  });
  approve(folder, "work/release.md", "pm", "2026-11-01T11:00:00Z");
  copyFromFinished(folder, "work/rollout.yaml");
  const rolloutMessage = "Write the district rollout with guardrails from the contract";
  commitAs(folder, {
    at: "2026-11-01T13:00:00Z",
    files: [],
    message: rolloutMessage,
    byClaude: true,
  });
  approve(folder, "work/rollout.yaml", "release-manager", "2026-11-01T15:00:00Z");
}

function addTheIncidentLogs(folder: string) {
  const target = join(folder, "data", "incidents", "north-double-wrench");
  cpSync(INCIDENT_LOGS, target, { recursive: true });
  const message = "Add the North incident logs";
  commitAs(folder, { at: "2026-11-03T11:30:00Z", files: [], message, who: "tech-lead" });
}

if (import.meta.main) {
  const output = process.argv[2];
  if (!output || existsSync(output)) {
    console.log("Name a new folder: bun make-begin-history.ts /tmp/part-7-begin");
    process.exit(1);
  }
  startRepo(output);
  readyTheRepo(output);
  planTheChange(output);
  designTheChange(output);
  buildTheChange(output);
  reviewTheChange(output);
  releaseTheChange(output);
  addTheIncidentLogs(output);
  console.log(`Built the Part 7 begin state in ${output}`);
}
