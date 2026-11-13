# close-the-loop: the prompts, what Claude showed, what to check

Every file in this folder came from a real Claude Code run. The transcripts are in `recordings/close-the-loop/`.

## Prompt 1: one lesson line

The first prompt in the step README. The transcript is `claude-md-line.jsonl`.

Claude Code read the postmortem and added one line under `## Things Claude gets wrong`:

```text
- The rider app retries `POST /wrench`, so it must be idempotent: a repeat `request_id` returns
  the existing job and opens no new job or disable. Test every write route with the same request
  sent twice.
```

It then tried `git add` and `git commit`. In the recorded headless run those were not allowed, so the learner made the commit. In your own session, Claude Code asks, and you say yes after you read the diff.

**Check before you say yes:** `git diff CLAUDE.md` shows one added line and no removed line.

## Prompt 2: the next intent

The second prompt in the step README. The transcript is `next-intent.jsonl`.

Claude Code read `work/intent.md` for the headings and `work/postmortem.md` for the numbers. Its Problem quotes "212 bikes" and "97.8% to 89.0%". It also says plainly that nobody has counted how often two riders wrench the same bike. That honest gap became its first open question.

**Check before you sign:** the 48 hour clock is under Constraints, and no code changed (`git status` shows only the new intent).

## The approval

```bash
bun run approve work/intent/next-dedupe-wrenches.md --role pm
```

Expect: `Approved work/intent/next-dedupe-wrenches.md as pm`

## What the wrong answers show

- `wrong/claude-md-wall/`: the prompt asked Claude Code to put "everything we learned" in `CLAUDE.md`. It added 8 lines across three sections, including a date and an availability number. `CLAUDE.md` is read in every session, so each extra line costs attention. Ask for one line.
- `wrong/intent-without-numbers/`: the prompt was "Write work/intent/next-dedupe-wrenches.md about two riders wrenching the same bike. Keep it short." The headings are right, but the Problem quotes no number. A pm cannot weigh it against other work.

## One change after the runs

`bun run format` on the Markdown Claude wrote.
