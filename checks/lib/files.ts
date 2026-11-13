// Small helpers every check uses to read the learner's files.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export function readFile(folder: string, path: string): string {
  const fullPath = join(folder, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

export function fileExists(folder: string, path: string): boolean {
  return existsSync(join(folder, path));
}

export function readJson(folder: string, path: string): unknown {
  try {
    return JSON.parse(readFile(folder, path));
  } catch {
    return undefined;
  }
}

export function countLines(text: string): number {
  return text.trimEnd() === "" ? 0 : text.trimEnd().split("\n").length;
}

// The headings of a Markdown page, without the # signs: "## Commands" becomes "Commands".
export function headingsOf(markdown: string): string[] {
  const headingLines = markdown.split("\n").filter((line) => /^#{1,6}\s/.test(line));
  return headingLines.map((line) => line.replace(/^#+\s*/, "").trim());
}

function sameHeading(line: string, heading: string): boolean {
  const text = line
    .replace(/^#+\s*/, "")
    .trim()
    .toLowerCase();
  return /^#{1,6}\s/.test(line) && text === heading.toLowerCase();
}

// The text under one heading, up to the next heading of any level.
export function sectionOf(markdown: string, heading: string): string {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => sameHeading(line, heading));
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^#{1,6}\s/.test(line));
  const body = end < 0 ? rest : rest.slice(0, end);
  return body.join("\n").trim();
}

export function sha256Of(text: string): string {
  return new Bun.CryptoHasher("sha256").update(text).digest("hex");
}

function filesUnder(folder: string, path: string): string[] {
  const fullPath = join(folder, path);
  if (!statSync(fullPath).isDirectory()) return [path];
  const entries = readdirSync(fullPath).sort();
  return entries.flatMap((entry) => filesUnder(folder, join(path, entry)));
}

// The hash a gate stores. A folder, such as test/acceptance, hashes every file name and file in it.
export function contentHash(folder: string, path: string): string {
  if (!existsSync(join(folder, path))) return "";
  const files = filesUnder(folder, path);
  if (files.length === 1 && files[0] === path) return sha256Of(readFile(folder, path));
  const everyFile = files.map((file) => `${file}\n${readFile(folder, file)}`);
  return sha256Of(everyFile.join("\n"));
}
