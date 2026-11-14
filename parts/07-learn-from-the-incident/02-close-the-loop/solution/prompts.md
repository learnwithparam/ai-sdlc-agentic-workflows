# close-the-loop: the prompts, what Claude showed, what to check

Every file in this folder came from a real Claude Code run. The transcripts are in `recordings/close-the-loop/`.

## Prompt 1: one lesson line

The first prompt in the step README. The transcript is `claude-md-line.jsonl`.

Claude Code read the postmortem and added one line under `## Things Claude gets wrong`. It says to treat every write route as retried: the app resends `POST /wrench` up to 3 times, so a repeated `request_id` must return the existing job with no new row and no second disable, and tests must send the same request more than once.

It then tried `git add` and `git commit`. In the recorded headless run those were not allowed, so the learner made the commit. In your own session, Claude Code asks, and you say yes after you read the diff.

**Check before you say yes:** `git diff CLAUDE.md` shows one added line and no removed line.

## Prompt 2: the next intent

The second prompt in the step README. The transcript is `next-intent.jsonl`.

Claude Code read `work/intent.md` for the headings and `work/postmortem.md` for the numbers. Its Problem quotes numbers from the Impact section of the postmortem.

**Check before you sign:** the 48 hour clock is under Constraints, and no code changed (`git status` shows only the new intent).

## The approval

```bash
bun run approve work/intent/next-dedupe-wrenches.md --role pm
```

Expect: `Approved work/intent/next-dedupe-wrenches.md as pm`

## What the wrong answers show

- `wrong/claude-md-wall/`: the prompt asked Claude Code to put "everything we learned" in `CLAUDE.md`. It added 3 lines and rewrote an existing one, with a date and the incident numbers. `CLAUDE.md` is read in every session, so each extra line costs attention. Ask for one line.
- `wrong/intent-without-numbers/`: the prompt was "Write work/intent/next-dedupe-wrenches.md about two riders wrenching the same bike. Keep it short." It left out a required heading, and the Problem quotes no number. A pm cannot weigh it against other work.

## One change after the runs

`bun run format` on the Markdown Claude wrote.
