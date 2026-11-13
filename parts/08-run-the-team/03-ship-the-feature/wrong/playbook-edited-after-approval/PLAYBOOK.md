# Playbook: how we work with Claude Code

## Our stance on AI

Claude Code writes the drafts: specs, plans, code and tests. People sign them off. Each stage file is approved by a named person in a set role, and that approval is recorded in `work/approvals.jsonl`. Claude can never record an approval itself, because `bun run approve` is denied.

## Approval gates

Each file below needs sign-off from the role shown before work moves on. An approval is one line in `work/approvals.jsonl` holding the file, its sha256, the approver's role, the time and the approver's name.

| File                                     | Approved by     |
| ---------------------------------------- | --------------- |
| `work/intent.md`                         | PM              |
| `work/spec.md`                           | PM              |
| `work/decisions/0001-disable-in-feed.md` | Tech lead       |
| `work/plan.md`                           | Tech lead       |
| `test/acceptance`                        | QA              |
| `REVIEW.md`                              | Tech lead       |
| `work/release.md`                        | PM              |
| `work/rollout.yaml`                      | Release manager |
| `work/postmortem.md`                     | Tech lead       |
| `work/intent/next-dedupe-wrenches.md`    | PM              |

## What Claude must never do

These rules are enforced in `.claude/settings.json`.

- **Denied:** editing or writing anything in `/data/contract/**`. The city owns the contract.
- **Denied:** editing or writing anything in `/test/acceptance/**`. QA approved these tests, so change the code instead.
- **Denied:** running `bun run approve *`. An approval is a person's decision.
- **Asks first:** running `bun run deploy:production *`. A person confirms every production deploy, and only after the release manager has approved `work/rollout.yaml`.

## How big a change can be

Keep each commit under 200 changed lines (a rule from `CLAUDE.md`). Make one commit per plan item, and start the message with the item id, for example `P-2: ...`.

## When we let the factory run on its own

Not yet. Nothing in the repo is set up to run without a person in the loop. Every stage starts from a file a person approved, and every deploy asks a person first.

These always need a person:

- Approving any stage file (`bun run approve` is denied).
- Production deploys (`bun run deploy:production` always asks).
- Changes to `data/contract/` or `test/acceptance/` (denied outright).
