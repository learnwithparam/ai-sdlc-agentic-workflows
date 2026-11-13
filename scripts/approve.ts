// bun run approve <file> --role <role>: a person signs a stage's file. This is the human gate.
// The file can be a folder, such as test/acceptance: then every file in it is signed together.
//
// It stores the file's sha256 hash in work/approvals.jsonl and commits both in kestrel/.
// If the file changes later, the hash no longer matches and the gate is open again.
// Claude Code may never run this: an approval is a person's decision.
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { APPROVALS_FILE, type Approval } from "../checks/lib/approvals";
import { contentHash } from "../checks/lib/files";
import { git } from "../checks/lib/git";
import { WORKSPACE } from "./structure";

export const ROLES = ["pm", "tech-lead", "qa", "release-manager", "em"];

function stop(message: string): never {
  console.log(message);
  process.exit(1);
}

function readArguments(): { file: string; role: string } {
  const words = process.argv.slice(2);
  const roleAt = words.indexOf("--role");
  const role = roleAt >= 0 ? words[roleAt + 1] : "";
  const file = words.find((word, index) => !word.startsWith("--") && index !== roleAt + 1) ?? "";
  return { file: file.replace(/^kestrel\//, ""), role };
}

function checkTheRequest(file: string, role: string) {
  // Claude Code sets CLAUDECODE=1 in every command it runs, so this is how we know.
  if (process.env.CLAUDECODE) stop("Only a person can approve. Claude Code may not run approve.");
  if (!existsSync(WORKSPACE)) stop("There is no kestrel/ yet. Run: bun run start meet-kestrel");
  if (!file)
    stop("Name the file to approve, for example: bun run approve work/intent.md --role pm");
  if (!ROLES.includes(role)) stop(`Name a role with --role. Roles: ${ROLES.join(", ")}`);
  if (!existsSync(join(WORKSPACE, file))) stop(`There is no kestrel/${file} to approve.`);
}

function recordApproval(file: string, role: string): Approval {
  const author = git(WORKSPACE, ["config", "user.name"]).trim() || "unknown";
  const approval = {
    file,
    sha256: contentHash(WORKSPACE, file),
    role,
    at: new Date().toISOString(),
    by: author,
  };
  const approvalsPath = join(WORKSPACE, APPROVALS_FILE);
  mkdirSync(dirname(approvalsPath), { recursive: true });
  appendFileSync(approvalsPath, `${JSON.stringify(approval)}\n`);
  return approval;
}

if (import.meta.main) {
  const { file, role } = readArguments();
  checkTheRequest(file, role);
  const approval = recordApproval(file, role);
  git(WORKSPACE, ["add", file, APPROVALS_FILE]);
  git(WORKSPACE, ["commit", "--quiet", "--message", `approve: ${file} by ${role}`]);
  console.log(`Approved ${file} as ${role} (sha256 ${approval.sha256.slice(0, 8)}).`);
}
