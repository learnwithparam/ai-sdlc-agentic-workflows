# Recorded Claude Code runs for Build the change

Every end state in this part came from a real, headless Claude Code run. Nobody wrote a transcript or a commit by hand. The only change to a raw transcript is that the `model` field reads `(not shown)`, with `withoutModelNames` from `checks/lib/recordings.ts`.

For course authors: these entries belong in `world/recordings/RECORD.md`. A part session may not edit `world/` or `config/`, so they wait here for the supervisor.

- **Made with:** Claude Code 2.1.323, signed in with a Claude plan.
- **Folder it runs in:** `kestrel/`, made by `bun run start <step-name>`.
- **Headless flags:** `headlessArguments` in `config/claude-code.ts`. Authoring runs used `maxTurns` 40 and `maxBudgetUsd` 3.
- **Gates:** each approval was made with `bun run approve`, with `git config user.name` set to the role's person in `data/roster.csv`.
- **Git history:** `write-the-failing-tests` and `build-in-small-slices` keep their history in `history.bundle` (`git bundle create history.bundle --all`), in `problem/`, `solution/` and each `wrong/`.

## The step's own test run

`plan-in-plan-mode/solution/recordings/plan-in-plan-mode/run-1.jsonl` came from `bun run record plan-in-plan-mode`. The prompt and flags are in `parts/04-build-the-change/recorded-runs.ts`. Move that entry into `RECORDED_RUNS` in `config/claude-code.ts`. `wrong/planned-without-plan-mode/recordings/plan-in-plan-mode/run-1.jsonl` is the weak prompt's own run, in `acceptEdits` mode.

## Authoring runs

| Recording | Mode | Allowed tools | Prompt | Kept as |
| --- | --- | --- | --- | --- |
| `plan-in-plan-mode/first-plan-tests-inside-items.jsonl` | `plan` | none | a first prompt with tests inside each item | not kept |
| `plan-in-plan-mode/plan.jsonl` | `plan` | none | the step README's prompt | the plan text |
| `plan-in-plan-mode/save-the-plan.jsonl` | `acceptEdits` | `Read` and `cat` of the saved plan file | "Save it to work/plan.md word for word" | `solution/work/plan.md` |
| `plan-in-plan-mode/planned-without-plan-mode.jsonl` | `acceptEdits` | none | the weak prompt in `prompts.md` | `wrong/planned-without-plan-mode/` |
| `write-the-failing-tests/tests.jsonl` | `acceptEdits` | `bun test`, `git add`, `git commit`, `git status`, `git diff`, `mkdir`, `ls` | the step README's prompt | `solution/history.bundle` |
| `write-the-failing-tests/ci-blocks-red.jsonl` | `acceptEdits` | the same | "Our CI blocks red builds" | not kept: Claude Code would not commit red tests |
| `write-the-failing-tests/code-before-tests.jsonl` | `acceptEdits` | the same | the weak prompt in `prompts.md` | `wrong/code-before-tests/history.bundle` |
| `build-in-small-slices/build.jsonl` | `acceptEdits` | `bun test`, `git add`, `git commit`, `git status`, `git diff`, `git log`, `git show` | the step README's prompt | `solution/history.bundle` |
| `build-in-small-slices/one-big-commit.jsonl` | `acceptEdits` | the same | "Commit all of it in one commit" | `wrong/one-big-commit/history.bundle` |
| `build-in-small-slices/skipped-an-item.jsonl` | `acceptEdits` | the same | "skip P-4" | `wrong/skipped-an-item/history.bundle` |
| `build-in-small-slices/edited-the-test.jsonl` | `acceptEdits` | the same | "skip P-4" plus "mark the AC-5 test with test.skip" | `wrong/edited-the-test/history.bundle` |

## Edits made after a run

- `work/plan.md` was formatted with `bun run format` before the tech lead signed it.
- `problem/work/decisions/0001-disable-in-feed.md` puts the GBFS quote in a text block, word for word, because `plain-english.ts` reads `problem/` files. The tech lead signed it again.

Pictures: each step's `images/expected.png` is `bun run verify <step-name>` after `bun run catch-up <step-name>`, drawn as `scripts/shots.ts` draws a terminal. `build-in-small-slices/images/map.png` is the real map after `POST /wrench` for `B-2207`, drawn as `mapShot` in `scripts/shots.ts` does.
