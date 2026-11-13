// Reads work/approvals.jsonl: one line per human gate, written by bun run approve.
// An approval counts only when its hash still matches the file, so a late edit breaks the gate.
import { contentHash, readFile } from "./files";

export const APPROVALS_FILE = "work/approvals.jsonl";

export type Approval = { file: string; sha256: string; role: string; at: string; by: string };

export function readApprovals(folder: string): Approval[] {
  const lines = readFile(folder, APPROVALS_FILE).split("\n");
  const approvals: Approval[] = [];
  for (const line of lines) {
    if (line.trim() === "") continue;
    try {
      approvals.push(JSON.parse(line));
    } catch {
      // A broken line is not an approval.
    }
  }
  return approvals;
}

export function latestApproval(folder: string, file: string, role: string) {
  const matching = readApprovals(folder).filter(
    (approval) => approval.file === file && approval.role === role,
  );
  return matching.at(-1);
}

// True when the role approved the file as it is now.
export function approvalHolds(folder: string, file: string, role: string): boolean {
  const approval = latestApproval(folder, file, role);
  if (!approval) return false;
  const hash = contentHash(folder, file);
  return hash !== "" && approval.sha256 === hash;
}

// True when the gate for `later` came after the gate for `earlier`: stages happen in order.
export function approvedInOrder(folder: string, earlier: string, later: string): boolean {
  const approvals = readApprovals(folder);
  const first = approvals.findIndex((approval) => approval.file === earlier);
  const second = approvals.findLastIndex((approval) => approval.file === later);
  return first >= 0 && second > first;
}
