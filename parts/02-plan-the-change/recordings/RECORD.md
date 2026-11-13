# Recorded Claude Code runs for Plan the change

Every end state in this part came from a real, headless Claude Code run. Nobody wrote a transcript by hand. The only change to a raw transcript is that the `model` field reads `(not shown)`, with `withoutModelNames` from `checks/lib/recordings.ts`.

For course authors: these entries belong in `world/recordings/RECORD.md`. A part session may not edit `world/`, so they wait here for the supervisor to move them.

- **Made with:** Claude Code 2.1.323, signed in with a Claude plan.
- **Folder it runs in:** `kestrel/`, made by `bun run start <step-name>`.
- **Headless flags:** `headlessArguments` in `config/claude-code.ts`, with `maxTurns` 40 and `maxBudgetUsd` 3.
- **Gates:** each approval was made with `bun run approve`, with `git config user.name` set to the role's person in `data/roster.csv`.

| Recording                                      | Step                    | Mode          | Allowed tools                      | Prompt                                   | Kept as                         |
| ---------------------------------------------- | ----------------------- | ------------- | ---------------------------------- | ---------------------------------------- | ------------------------------- |
| `find-the-real-problem/findings.jsonl`         | `find-the-real-problem` | `acceptEdits` | `Bash(bun *)`, `Bash(mkdir *)`     | the step README's prompt                 | `solution/work/`                |
| `find-the-real-problem/more-crews.jsonl`       | `find-the-real-problem` | `acceptEdits` | none                               | the weak prompt in `prompts.md`          | `wrong/more-crews/work/`        |
| `capture-the-intent/intent.jsonl`              | `capture-the-intent`    | `acceptEdits` | none                               | the step README's prompt                 | `solution/work/intent.md`       |
| `capture-the-intent/skipped-the-template.jsonl` | `capture-the-intent`   | `acceptEdits` | none                               | "Write work/intent.md for this change. Keep it to a few lines." | `wrong/skipped-the-template/work/` |
| `capture-the-intent/edited-after-approval.jsonl` | `capture-the-intent`  | `acceptEdits` | none                               | the edit prompt in `prompts.md`, run after the pm signed | `wrong/edited-after-approval/work/` |

Pictures: each step's `images/expected.png` is `bun run verify <step-name>` after `bun run catch-up <step-name>`, drawn as a dark terminal 800 pixels wide, the way `scripts/shots.ts` draws it. The supervisor can add both steps to `scripts/shots.ts`.
