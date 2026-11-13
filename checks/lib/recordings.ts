// Reads a recorded Claude Code run: the stream-json lines of claude -p --output-format stream-json.
// Lines are found by their type, never by their position, because new versions add new lines.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileExists, readFile } from "./files";

export type RunLine = {
  type: string;
  subtype?: string;
  permissionMode?: string;
  skills?: string[];
  agents?: string[];
  message?: { content?: ContentBlock[] };
  permission_denials?: Denial[];
  is_error?: boolean;
};
export type ContentBlock = { type: string; name?: string; input?: Record<string, unknown> };
export type Denial = { tool_name: string; tool_input: Record<string, unknown> };

export function readRun(folder: string, path: string): RunLine[] {
  const lines = readFile(folder, path).split("\n");
  const parsed: RunLine[] = [];
  for (const line of lines) {
    if (line.trim() === "") continue;
    try {
      parsed.push(JSON.parse(line));
    } catch {
      // A torn last line from a stopped run is skipped, not fatal.
    }
  }
  return parsed;
}

export function runsFor(folder: string, step: string): RunLine[][] {
  const runFolder = join("recordings", step);
  if (!fileExists(folder, runFolder)) return [];
  const runFiles = readdirSync(join(folder, runFolder)).filter((name) => name.endsWith(".jsonl"));
  return runFiles.sort().map((name) => readRun(folder, join(runFolder, name)));
}

export const initLineOf = (run: RunLine[]) =>
  run.find((line) => line.type === "system" && line.subtype === "init");

export const resultLineOf = (run: RunLine[]) => run.find((line) => line.type === "result");

export function toolCallsOf(run: RunLine[]): ContentBlock[] {
  const assistantLines = run.filter((line) => line.type === "assistant");
  const blocks = assistantLines.flatMap((line) => line.message?.content ?? []);
  return blocks.filter((block) => block.type === "tool_use");
}

export function deniedCallsOf(run: RunLine[]): Denial[] {
  return resultLineOf(run)?.permission_denials ?? [];
}

// For example, deniedPathsOf(run) gives ["/home/you/kestrel/data/contract/sla.yaml"].
export function deniedPathsOf(run: RunLine[]): string[] {
  const paths = deniedCallsOf(run).map((denial) => String(denial.tool_input.file_path ?? ""));
  return paths.filter(Boolean);
}

// No page, screen or recording the learner sees names a model (briefs/MODELS.md).
// This is the only change made to a raw transcript before it is saved.
export function withoutModelNames(transcript: string): string {
  return transcript.replace(/"model":"[^"]*"/g, '"model":"(not shown)"');
}
