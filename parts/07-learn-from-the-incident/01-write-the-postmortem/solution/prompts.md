# write-the-postmortem: the prompts, what Claude showed, what to check

Every file in this folder came from a real Claude Code run. The transcripts are in `recordings/write-the-postmortem/`.

## Prompt 1: the postmortem

The first prompt in the step README. Claude Code read the four log files, `work/plan.md` and `work/rollout.yaml`, then wrote `work/postmortem.md`. The transcript is `postmortem.jsonl`.

What it got right, so you can check yours the same way:

- Impact says 212 bikes, 3 hours 10 minutes, 97.8% and 89.0%. It names the log line for each number.
- Every Timeline time is in `incident.log` or `deploys.log`.
- Contributing factors name `POST /wrench`, the missing test and the guardrail. No person.

**What to reject:** action item A-7 said "The alert config in the repo shows the new threshold". That names no file and no command, so nobody can prove it is done. The check fails it.

## Prompt 2: fix the weak check

```text
In work/postmortem.md, action item A-7 has no check a person can run. Every action item needs a
Check that names a command or a file in backticks. Fix A-7 and any other item like it. Change
nothing else.
```

Claude Code changed only the A-7 row. The new check is a test that replays `availability.csv`. The transcript is `check-fix.jsonl`.

## Prompt 3: the test, then the fix

The second prompt in the step README. The transcript is `regression.jsonl`.

1. Claude Code wrote `test/regression/a-1-retried-wrench.test.ts` and ran it. It showed `1 fail`: the incident build opened 3 jobs for one bike.
2. It committed the test alone: `A-1: regression test for a wrench retried with the same request_id`.
3. It changed `src/wrenches.ts` and `src/database.ts`. A wrench now stores its `request_id`, and a retry gets the first job back.
4. It ran `bun test`: 8 pass, 0 fail. It committed the fix alone.

**Check before you say yes:** the test commit comes before the fix commit in `git log`. Nothing in `test/acceptance/` changed.

## The approval

```bash
bun run approve work/postmortem.md --role tech-lead
```

Expect: `Approved work/postmortem.md as tech-lead`

## What the wrong answers show

- `wrong/blames-the-engineer/`: the prompt asked "say who made the mistake". Claude Code pushed back and wrote mostly about systems. But it still quoted "Raj Patel" under Contributing factors, and its action items have no Check. A weak prompt leaks blame even when Claude resists it.
- `wrong/fix-without-a-test/`: the prompt said "just the fix, we do not need a test". Claude Code fixed `src/wrenches.ts` and wrote no test. The bug is gone today, and nothing stops it coming back.

## One change after the runs

`bun run format` on the Markdown and code Claude wrote, so tables line up. In the commit messages, the `Co-Authored-By` trailer reads `Claude`, with no model name.
