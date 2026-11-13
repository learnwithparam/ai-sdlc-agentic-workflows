// roll-out-with-openfeature: the staged rollout from the release part, redone as one flag that
// flagd serves. The check reads the flag file and works out what a reader app would answer for one
// user inside the North district and one outside it. The live version of the same lines is
// assignment/check.ts, which needs the compose stack.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../scripts/structure";
import { fileExists, readFile, readJson } from "./lib/files";
import type { Rule } from "./lib/rule";

const FLAG = "wrench_disables_bike";
const FLAG_FILE = "assignment/flags/flagd.json";
const FIRST_STAGE = "North";

type Logic = unknown;
type Flag = { state?: string; variants?: Record<string, unknown>; defaultVariant?: string };
type FlagFile = { flags?: Record<string, Flag & { targeting?: Logic }> };

// A learner works in kestrel/, which holds no assignment/ folder, so their own copy is read.
function assignmentFolder(folder: string): string {
  return existsSync(join(folder, "assignment")) ? folder : ROOT;
}

// The part of JsonLogic that flagd rules in this course use: if, ==, in, and, or, !, var.
type Operation = (args: unknown[], context: Record<string, string>) => unknown;
const OPERATIONS: Record<string, Operation> = {
  var: (args, context) => context[String(args[0])] ?? null,
  "==": (args) => args[0] === args[1],
  in: (args) => Array.isArray(args[1]) && args[1].includes(args[0]),
  and: (args) => args.every(Boolean),
  or: (args) => args.some(Boolean),
  "!": (args) => !args[0],
  if: (args) => (args[0] ? args[1] : (args[2] ?? null)),
};

function evaluate(logic: Logic, context: Record<string, string>): unknown {
  if (Array.isArray(logic)) return logic.map((part) => evaluate(part, context));
  if (typeof logic !== "object" || logic === null) return logic;
  const [operator, raw] = Object.entries(logic)[0];
  const operation = OPERATIONS[operator];
  if (!operation) throw new Error(`unsupported operator ${operator}`);
  const args = (Array.isArray(raw) ? raw : [raw]).map((part) => evaluate(part, context));
  return operation(args, context);
}

// What the reader app would return for this user, as true or false.
function readFlag(folder: string, context: Record<string, string>): boolean | undefined {
  const parsed = readJson(assignmentFolder(folder), FLAG_FILE) as FlagFile | undefined;
  const flag = parsed?.flags?.[FLAG];
  if (flag?.state !== "ENABLED") return undefined;
  const targeting = (flag as { targeting?: Logic }).targeting;
  const chosen = targeting ? evaluate(targeting, context) : null;
  const variant = typeof chosen === "string" ? chosen : flag.defaultVariant;
  return variant ? (flag.variants?.[variant] as boolean | undefined) : undefined;
}

const inGroup = { targetingKey: "u-100", district: FIRST_STAGE };
const outsideGroup = { targetingKey: "u-200", district: "East" };

const rules: Rule[] = [
  {
    says: `The flag file defines ${FLAG}, enabled, with an on and an off variant`,
    test: (folder) => {
      const text = readFile(assignmentFolder(folder), FLAG_FILE);
      return text.includes(FLAG) && readFlag(folder, outsideGroup) !== undefined;
    },
    tryNext: `Keep ${FLAG} in assignment/flags/flagd.json with variants on and off.`,
  },
  {
    says: `A user in ${FIRST_STAGE}, the first stage of the rollout plan, reads on`,
    test: (folder) => readFlag(folder, inGroup) === true,
    tryNext: `Ask Claude Code to add targeting so district ${FIRST_STAGE} gets the on variant.`,
  },
  {
    says: "A user outside the group still reads off",
    test: (folder) => readFlag(folder, outsideGroup) === false,
    tryNext: "Keep the default variant off, so only the group sees the change.",
  },
  {
    says: "The flag is off by default, so a user with no district reads off",
    test: (folder) => readFlag(folder, { targetingKey: "u-300" }) === false,
    tryNext: 'Set "defaultVariant" to "off" in the flag file.',
  },
  {
    says: "assignment/CHOICE.md says when a flag UI is worth another server",
    test: (folder) => {
      const text = readFile(assignmentFolder(folder), "assignment/CHOICE.md").toLowerCase();
      return text.includes("choose when") && text.includes("trade-off");
    },
    tryNext: "Write assignment/CHOICE.md with a Choose when line and a Trade-off line.",
  },
  {
    says: "assignment/prompts.md holds the prompts you gave Claude Code",
    test: (folder) => fileExists(assignmentFolder(folder), "assignment/prompts.md"),
    tryNext: "Save the prompts you gave Claude Code in assignment/prompts.md.",
  },
];

export default rules;
