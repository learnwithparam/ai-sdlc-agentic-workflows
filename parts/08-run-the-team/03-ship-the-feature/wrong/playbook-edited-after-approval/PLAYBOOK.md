# PLAYBOOK.md

How the `spoke` team works with Claude Code. Everything here is backed by a file already in the
repo: `work/approvals.jsonl`, `.claude/settings.json`, `CLAUDE.md` or `AGENTS.md`.

## Our AI stance

Claude drafts the work; people sign off on it. Each gated file needs a sign-off from a person in
a named role. A sign-off is one line in `work/approvals.jsonl` that records the file's `sha256`,
the approver's role (`role`), their name (`by`) and the time (`at`). Because the line pins the
hash, a sign-off covers only that exact version of the file: change the file and it needs signing
again.

## Gates

Each file below needs a sign-off from the listed role, recorded as a line in
`work/approvals.jsonl` with `sha256`, `role`, `by` and `at`.

| File                                     | Who approves    |
| ---------------------------------------- | --------------- |
| `work/intent.md`                         | pm              |
| `work/spec.md`                           | pm              |
| `work/decisions/0001-disable-in-feed.md` | tech-lead       |
| `work/plan.md`                           | tech-lead       |
| `test/acceptance`                        | qa              |
| `REVIEW.md`                              | tech-lead       |
| `work/release.md`                        | pm              |
| `work/rollout.yaml`                      | release-manager |
| `work/postmortem.md`                     | tech-lead       |
| `work/intent/next-dedupe-wrenches.md`    | pm              |

`work/spec.md` and `work/decisions/0001-disable-in-feed.md` have each been signed twice. When a
file has more than one sign-off, the latest line is the one that counts.

## What Claude can't do on its own

These rules live in `.claude/settings.json`:

- `Edit(/data/contract/**)` is **denied**: Claude can't edit the city contract
  (`data/contract/sla.yaml`).
- `Write(/data/contract/**)` is **denied**: Claude can't create or overwrite files under
  `data/contract/`.
- `Bash(bun run deploy:production *)` is set to **ask**: Claude can run it only after a person
  says yes.

## Size of a change

`CLAUDE.md` sets no limit on how many lines a change can touch. `work/plan.md` sets a target for
the current feature only: steps P-2 to P-5 each go in their own commit, and each commit stays
under 200 changed lines. That target applies to this feature, not to the whole repo.

## When we use the factory (unattended runs)

The "factory" means letting Claude run with no person in the loop. Nothing in the repo sets that
up yet, and no kind of change is marked as safe for it. So for now, no change runs unattended.

These must never run without a person:

- Edits or writes to `data/contract/**`. They are denied outright.
- `bun run deploy:production`. It is an ask rule, so it waits for a person's yes.
- Any file in the Gates table. Each one needs a sign-off from the role listed there.
