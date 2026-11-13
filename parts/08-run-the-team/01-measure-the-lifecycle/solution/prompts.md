# measure-the-lifecycle: the prompts, what Claude showed, what to check

Every file in this folder came from a real Claude Code run. The transcript is `recordings/measure-the-lifecycle/metrics.jsonl`.

## Prompt 1: the numbers

The prompt in the step README. Claude Code first tried `python3` and a few longer shell lines. Those were not on the allowed list in the headless run, so it switched to `bun -e` and `git log`, which were. In your own session, Claude Code asks before each command.

What it wrote, so you can check yours:

- Deployment frequency: 69 deploys, 2.68 a week.
- Lead time: 66.02 hours. Change failure rate: 13.0%. Time to restore: 3.52 hours.
- Intent to spec: 27.50 hours. Spec commits after the first plan commit: 0. Files outside `plan.md`: 0.
- Trailer share: 60.0%, 18 of 30 commits. Median commit size: 16 lines.

It also named the last commit it counted, `52122d2`, in every git command. That way the numbers do not move when you add commits later.

**Check before you accept:** run one command yourself. For example, the change failure rate command prints `9 of 69 deploys = 13.0%`.

**What to keep in mind:** Claude Code wrote short one-letter names inside its `bun -e` commands. They are commands to run, not code to keep, so this is fine here.

## What the wrong answer shows

`wrong/dora-only/`: the prompt asked for "our DORA metrics" and "how much faster Claude Code made the team". Claude Code refused to claim a speedup, which is right. But it gave no git numbers, and its formulas are prose, not commands anyone can run. A vague prompt gets a report, not evidence.

## One change after the run

`bun run format` on the Markdown, so the tables line up.
