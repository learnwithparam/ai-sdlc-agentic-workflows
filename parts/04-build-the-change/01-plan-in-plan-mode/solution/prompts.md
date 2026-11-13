# plan-in-plan-mode: the prompts, what Claude showed, what to check

Every file here came from real, headless Claude Code runs. The transcripts are in `parts/04-build-the-change/recordings/plan-in-plan-mode/`. The step's own plan mode run is `recordings/plan-in-plan-mode/run-1.jsonl` in this folder.

## Prompt 1, in plan mode

The prompt in the step's README. Claude Code read the spec, the decision and every file in `src/`. It changed nothing. Its plan has five items:

| Item | What                                                              | Serves              |
| ---- | ----------------------------------------------------------------- | ------------------- |
| P-1  | 13 acceptance test files, one per AC, in `test/acceptance/`       | AC-1 to AC-13       |
| P-2  | the wrench disables the bike, all three writes in one transaction | AC-1 to 4, 6, 7, 13 |
| P-3  | the crew queue counts from `reported_at` and sorts by deadline    | AC-8 to AC-11       |
| P-4  | the map shows each station's counts                               | AC-5                |
| P-5  | `CLAUDE.md` no longer lists the two bugs                          | none                |

It also said which tests would pass today: AC-7, AC-12 and AC-13 guard against breaking what already works.

**Check before you accept:** P-1 holds only tests. Each later item names one or two files in `src/`. Risks names P-2 as the riskiest item, because riders use `POST /wrench`.

## Prompt 2, after you accept

"Save the plan you showed me to work/plan.md word for word." Claude Code wrote the file and changed nothing else. The tech lead then signed it.

**One change after the run:** `bun run format` spaced the tables. The tech lead signed the formatted file.

## What to reject

Our first try asked for tests inside each item ("P-1 code and its tests"). Claude Code's plan was good, but it put tests next to code in the same commit. Then nobody can prove a test failed before the fix. The transcript is `first-plan-tests-inside-items.jsonl`.

`wrong/planned-without-plan-mode/` came from this prompt, in `acceptEdits` mode:

```text
Plan how to build work/spec.md and write the plan to work/plan.md, with the headings Files
that change, Order of work, Risks, Proof. Keep it short.
```

The plan covers every AC, but its items have no ids. It writes five tests first, then the code, then "the remaining tests". And Claude Code was free to edit code while it planned. Nothing stopped it this time. Plan mode is what makes sure.
