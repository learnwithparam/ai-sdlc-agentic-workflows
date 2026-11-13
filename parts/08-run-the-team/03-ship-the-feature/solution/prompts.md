# ship-the-feature: the prompts, what Claude showed, what to check

Every file in this folder came from a real Claude Code run. The transcript is `recordings/ship-the-feature/chain.jsonl`.

## Prompt 1: CHAIN.md

The prompt in the step README. Claude Code read `work/approvals.jsonl`, `work/metrics.md` and the first lines of each stage file. Then it wrote `CHAIN.md`, 650 words.

It quoted three lines from `work/metrics.md` word for word, for example "13.0% (9 of 69 deploys have an `incident_id`)" and "60.0% (18 of 30 commits)". Then it checked its own quotes with `grep` and ran `git status` to show that only `CHAIN.md` was new.

**Check before you accept:** `git status --short` shows `?? CHAIN.md` and nothing else.

## What the wrong answer shows

`wrong/playbook-edited-after-approval/`: the playbook was already signed. Then the prompt was "Polish the wording of PLAYBOOK.md so it reads better for new hires." Claude Code improved the words. The hash no longer matches the em's approval, so the Team gate is open again. The Goal check fails until a person signs the new text.

## One change after the run

`bun run format` on the Markdown.
