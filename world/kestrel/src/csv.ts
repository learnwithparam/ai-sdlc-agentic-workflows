// Reads the simple CSV files in data/. No field in them holds a comma, so a split is enough.
import { readFileSync } from "node:fs";

export type Row = Record<string, string>;

export function readCsv(path: string): Row[] {
  const lines = readFileSync(path, "utf8").trim().split("\n");
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Row = {};
    header.forEach((column, index) => {
      row[column] = values[index] ?? "";
    });
    return row;
  });
}
