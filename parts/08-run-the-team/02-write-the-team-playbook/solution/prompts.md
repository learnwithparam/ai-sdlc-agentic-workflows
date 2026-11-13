# write-the-team-playbook: the prompts, what Claude showed, what to check

Every file in this folder came from a real Claude Code run. The transcript is `recordings/write-the-team-playbook/playbook.jsonl`.

## Prompt 1: the playbook

The prompt in the step README. Claude Code read `work/approvals.jsonl` and `.claude/settings.json`. It already knew `CLAUDE.md`, because Claude Code loads it at the start of every session. Then it wrote `PLAYBOOK.md`.

What it got right:

- The Gates table has 10 rows, one per approval, including `REVIEW.md` and `work/postmortem.md`.
- Never do has one bullet per rule: 5 deny rules and 1 ask rule, each in backticks.
- The size limit is 200 changed lines, copied from `CLAUDE.md`.
- When we use the factory says the truth: nothing runs with no person yet.

**Check before you sign:** put the Gates table next to `work/approvals.jsonl`. Each row must be a real line there.

## The approval

```bash
bun run approve PLAYBOOK.md --role em
```

Expect: `Approved PLAYBOOK.md as em`

## What the wrong answer shows

`wrong/ideal-playbook/`: the prompt asked for "the ideal way for a team to work with Claude Code". Claude Code wrote a good-looking page about gates and rules this repo does not have. A playbook must describe your team, not a perfect one.

## One change after the run

`bun run format` on the Markdown, so the table lines up.
