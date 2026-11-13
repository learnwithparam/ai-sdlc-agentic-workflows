# Playbook: how we work with Claude Code

## Our AI stance

Claude Code writes drafts: specs, plans, code and tests. People sign. Every stage file is approved by a named person in a set role, and that approval is recorded in `work/approvals.jsonl`. Claude never records an approval itself (`bun run approve` is denied).

## Gates

| File                                     | Who approves    | How it is recorded                                                    |
| ---------------------------------------- | --------------- | --------------------------------------------------------------------- |
| `work/intent.md`                         | PM              | Line in `work/approvals.jsonl` with file, sha256, role, time and name |
| `work/spec.md`                           | PM              | Line in `work/approvals.jsonl` with file, sha256, role, time and name |
| `work/decisions/0001-disable-in-feed.md` | Tech lead       | Line in `work/approvals.jsonl` with file, sha256, role, time and name |
| `work/plan.md`                           | Tech lead       | Line in `work/approvals.jsonl` with file, sha256, role, time and name |
| `test/acceptance`                        | QA              | Line in `work/approvals.jsonl` with file, sha256, role, time and name |
| `REVIEW.md`                              | Tech lead       | Line in `work/approvals.jsonl` with file, sha256, role, time and name |
| `work/release.md`                        | PM              | Line in `work/approvals.jsonl` with file, sha256, role, time and name |
| `work/rollout.yaml`                      | Release manager | Line in `work/approvals.jsonl` with file, sha256, role, time and name |
| `work/postmortem.md`                     | Tech lead       | Line in `work/approvals.jsonl` with file, sha256, role, time and name |
| `work/intent/next-dedupe-wrenches.md`    | PM              | Line in `work/approvals.jsonl` with file, sha256, role, time and name |

## Never do

These rules live in `.claude/settings.json`.

- Deny: edit `/data/contract/**`. The city owns the contract.
- Deny: write `/data/contract/**`.
- Deny: edit `/test/acceptance/**`. QA approved these tests; change the code instead.
- Deny: write `/test/acceptance/**`.
- Deny: run `bun run approve *`. An approval is a person's decision.
- Ask: run `bun run deploy:production *`. A person confirms every production deploy, and only after the release manager approved `work/rollout.yaml`.

## Size of a change

Keep each commit under 200 changed lines (from `CLAUDE.md`). One commit per plan item, message starting with the item id, for example `P-2: ...`.

## When we use the factory

The repo does not yet set up any change to run with no person in the loop. Every stage starts from a file a person approved, and every deploy asks a person first.

These never run without a person:

- Approving any stage file (`bun run approve` is denied).
- Production deploys (`bun run deploy:production` always asks).
- Changes to `data/contract/` or `test/acceptance/` (denied outright).
