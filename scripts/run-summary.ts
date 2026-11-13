// Turns a recorded Claude Code run into plain sentences. It never prints the model's name.
import {
  type ContentBlock,
  deniedCallsOf,
  initLineOf,
  type RunLine,
  resultLineOf,
  toolCallsOf,
} from "../checks/lib/recordings";

function shortPath(path: unknown, kestrelFolder: string): string {
  return String(path ?? "").replace(`${kestrelFolder}/`, "");
}

function describeCall(call: ContentBlock, kestrelFolder: string): string {
  const input = call.input ?? {};
  if (call.name === "Bash") return `ran: ${String(input.command ?? "").split("\n")[0]}`;
  if (input.file_path) return `${call.name}: ${shortPath(input.file_path, kestrelFolder)}`;
  return String(call.name);
}

export function describeRun(run: RunLine[]): string[] {
  const init = initLineOf(run) as (RunLine & { cwd?: string }) | undefined;
  const kestrelFolder = init?.cwd ?? "";
  const lines = [`Claude Code started in ${init?.permissionMode ?? "an unknown"} mode.`];
  for (const call of toolCallsOf(run))
    lines.push(`  Claude Code ${describeCall(call, kestrelFolder)}`);
  for (const denial of deniedCallsOf(run)) {
    const target = denial.tool_input.file_path ?? String(denial.tool_input.command).split("\n")[0];
    lines.push(
      `  Blocked by a permission rule: ${denial.tool_name} ${shortPath(target, kestrelFolder)}`,
    );
  }
  const result = resultLineOf(run) as (RunLine & { num_turns?: number }) | undefined;
  lines.push(`The run ended after ${result?.num_turns ?? "?"} turns.`);
  return lines;
}
