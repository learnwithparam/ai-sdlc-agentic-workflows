// Reads the team's shared Claude Code settings: .claude/settings.json in the Kestrel repo.
import { readJson } from "./files";

export type Permissions = { allow: string[]; ask: string[]; deny: string[] };

type SettingsFile = { permissions?: Partial<Permissions> };

export function readPermissions(folder: string): Permissions | undefined {
  const settings = readJson(folder, ".claude/settings.json") as SettingsFile | undefined;
  if (!settings || typeof settings !== "object") return undefined;
  const permissions = settings.permissions ?? {};
  return {
    allow: permissions.allow ?? [],
    ask: permissions.ask ?? [],
    deny: permissions.deny ?? [],
  };
}

// True when one rule names this tool and its pattern mentions every word given.
// For example, ruleCovers(["Edit(/data/contract/**)"], "Edit", "data/contract") is true.
export function ruleCovers(rules: string[], tool: string, mentions: string): boolean {
  return rules.some((rule) => rule.startsWith(`${tool}(`) && rule.includes(mentions));
}
