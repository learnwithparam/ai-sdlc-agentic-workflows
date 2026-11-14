// The chain-ids check must fail on a mismatched P-1 or AC id, and pass on a matching one.
import { expect, test } from "bun:test";
import { problemsInSample } from "../scripts/chain-ids";

const specIds = [1, 2, 3];
const planIds = [1, 2];

test("an AC id that Part 4's spec lacks fails", () => {
  const found = problemsInSample("REVIEW.md", "Check AC-14 passes.", specIds, planIds);
  expect(found.length).toBe(1);
});

test("a P id that Part 4's plan lacks fails", () => {
  const found = problemsInSample("REVIEW.md", "Do P-7 next.", specIds, planIds);
  expect(found.length).toBe(1);
});

test("a plan whose P-1 disables the bike fails", () => {
  const plan = "- **P-1** Disable the bike when a wrench arrives. Serves AC-1.";
  expect(problemsInSample("work/plan.md", plan, specIds, planIds).length).toBe(1);
});

test("a plan whose P-1 is the acceptance tests passes", () => {
  const plan = "- **P-1** Write the acceptance tests. Serves AC-1.";
  expect(problemsInSample("work/plan.md", plan, specIds, planIds)).toEqual([]);
});

test("a spec with fewer criteria than Part 4's fails", () => {
  const spec = "**AC-1: one**\nWHEN a\nTHEN b\n";
  expect(problemsInSample("work/spec.md", spec, specIds, planIds).length).toBe(1);
});
