# PLAYBOOK.md

How the `spoke` team works with Claude Code. Every line here points at something the repo
already holds: `work/approvals.jsonl`, `.claude/settings.json`, `CLAUDE.md` and `AGENTS.md`.

## Our AI stance

Claude drafts the work. A person in a named role signs the files that gate it. A sign-off is a
line in `work/approvals.jsonl` that records the file's `sha256`, the approver's role, their name
and the time, so each sign-off covers that exact version of the file.

## Gates

| File                                    | Who approves    | How it is recorded                                             |
| --------------------------------------- | --------------- | -------------------------------------------------------------- |
| `work/intent.md`                        | pm              | Line in `work/approvals.jsonl` with `sha256`, `role`, `by`, `at` |
| `work/spec.md`                          | pm              | Line in `work/approvals.jsonl` with `sha256`, `role`, `by`, `at` |
| `work/decisions/0001-disable-in-feed.md` | tech-lead       | Line in `work/approvals.jsonl` with `sha256`, `role`, `by`, `at` |
| `work/plan.md`                          | tech-lead       | Line in `work/approvals.jsonl` with `sha256`, `role`, `by`, `at` |
| `test/acceptance`                       | qa              | Line in `work/approvals.jsonl` with `sha256`, `role`, `by`, `at` |
| `REVIEW.md`                             | tech-lead       | Line in `work/approvals.jsonl` with `sha256`, `role`, `by`, `at` |
| `work/release.md`                       | pm              | Line in `work/approvals.jsonl` with `sha256`, `role`, `by`, `at` |
| `work/rollout.yaml`                     | release-manager | Line in `work/approvals.jsonl` with `sha256`, `role`, `by`, `at` |
| `work/postmortem.md`                    | tech-lead       | Line in `work/approvals.jsonl` with `sha256`, `role`, `by`, `at` |
| `work/intent/next-dedupe-wrenches.md`   | pm              | Line in `work/approvals.jsonl` with `sha256`, `role`, `by`, `at` |

`work/spec.md` and `work/decisions/0001-disable-in-feed.md` were each signed twice. The latest
line is the one that counts.

## Never do

- `Edit(/data/contract/**)`: denied. Claude cannot edit the city contract (`data/contract/sla.yaml`).
- `Write(/data/contract/**)`: denied. Claude cannot write files under `data/contract/`.
- `Bash(bun run deploy:production *)`: ask. A person must say yes before Claude can run it.

## Size of a change

`CLAUDE.md` does not set a limit on changed lines. `work/plan.md` sets a target for the current
feature only: P-2 to P-5 each go in their own commit, and each stays under 200 changed lines.
That target is not a rule for the whole repo.

## When we use the factory

Nothing in the repo sets up runs with no person in the loop, and no kind of change is marked as
safe to run that way. So no change may run unattended yet.

These may never run without a person:

- Edits or writes to `data/contract/**`. They are denied outright.
- `bun run deploy:production`. It is an ask rule, so it waits for a person's yes.
- Any file in the Gates table. Each one needs a sign-off from the role listed there.
