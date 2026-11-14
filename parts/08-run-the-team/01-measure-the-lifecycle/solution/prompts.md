# measure-the-lifecycle: the prompts, what Claude showed, what to check

Every file in this folder came from a real Claude Code run. The transcript is `recordings/measure-the-lifecycle/metrics.jsonl`.

## Prompt 1: the numbers

The prompt in the step README. In the headless run only a short list of read-only commands was allowed, so Claude Code used `git log`, `awk` and `bun -e`. In your own session, Claude Code asks before each command.

What it wrote, so you can check yours:

- Deployment frequency: 69 deploys, 2.68 a week.
- Lead time: 66.02 hours. Change failure rate: 13.0%. Time to restore: 3.52 hours.
- Intent to spec: 0.00 hours, because the sample history was written in one sitting. Spec commits after the first plan commit: 0. Files outside `plan.md`: 12.
- Trailer share: 64.7%, 11 of 17 commits. Median commit size: 21.5 lines.

It also named the last commit it counted in every git command. That way the numbers do not move when you add commits later.

**Check before you accept:** run one command yourself. For example, the change failure rate command prints 9 of 69 deploys, which is 13.0%.

**A wording fix we made:** the first run counted a test file as named by the plan when only its folder was named. The prompt now says the full path must appear in `work/plan.md`, and the number matched the check.

## What the wrong answer shows

`wrong/dora-only/`: the prompt asked for "our DORA metrics" and "how much faster Claude Code made the team". Claude Code refused to claim a speedup, which is right. But it gave no git numbers, and its formulas are prose, not commands anyone can run. A vague prompt gets a report, not evidence.

## One change after the run

`bun run format` on the Markdown, so the tables line up.
