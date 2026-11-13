# Recorded Claude Code runs for Design the change

Every end state in this part came from a real, headless Claude Code run. Nobody wrote a transcript by hand. The only change to a raw transcript is that the `model` field reads `(not shown)`, with `withoutModelNames` from `checks/lib/recordings.ts`.

For course authors: these entries belong in `world/recordings/RECORD.md`. A part session may not edit `world/` or `config/`, so they wait here for the supervisor.

- **Made with:** Claude Code 2.1.323, signed in with a Claude plan.
- **Folder it runs in:** `kestrel/`, made by `bun run start <step-name>`.
- **Headless flags:** `headlessArguments` in `config/claude-code.ts`. Authoring runs used `maxTurns` 40 and `maxBudgetUsd` 3.
- **Gates:** each approval was made with `bun run approve`, with `git config user.name` set to the role's person in `data/roster.csv`.

## The step's own test runs

`solution/recordings/write-the-contract-skill/run-1.jsonl` to `run-3.jsonl`, and the same files in both `wrong/` folders, came from `bun run record write-the-contract-skill`. The prompt and flags are in `parts/03-design-the-change/recorded-runs.ts`. Move that entry into `RECORDED_RUNS` in `config/claude-code.ts`. The solution runs were made with the formatted `SKILL.md`. The two wrong answers were recorded with the file as Claude Code wrote it; formatting only adds a blank line after the first `---`.

## Authoring runs

| Recording                                         | Mode          | Allowed tools   | Prompt                                         | Kept as                                  |
| ------------------------------------------------- | ------------- | --------------- | ---------------------------------------------- | ---------------------------------------- |
| `write-the-contract-skill/skill.jsonl`            | `acceptEdits` | `Bash(mkdir *)` | the step README's prompt                       | `solution/.claude/skills/`               |
| `write-the-contract-skill/reference-not-rules.jsonl` | `acceptEdits` | `Bash(mkdir *)` | the first weak prompt in `prompts.md`       | `wrong/reference-not-rules/`             |
| `write-the-contract-skill/vague-description.jsonl` | `acceptEdits` | `Bash(mkdir *)` | a prompt that sets the description to "Notes about data/contract/sla.yaml." | `wrong/vague-description/` |
| `write-the-spec/spec.jsonl`                       | `acceptEdits` | none            | the prompt in `prompts.md`                     | `solution/work/spec.md`                  |
| `write-the-spec/keep-it-short.jsonl`              | `acceptEdits` | none            | the weak prompt in `prompts.md`                | `wrong/keep-it-short/work/spec.md`       |
| `write-the-spec/grace-period-without-skill.jsonl` | `acceptEdits` | none            | the same weak prompt, with the skill folder removed | not kept: Claude Code refused the grace period |
| `write-the-spec/grace-period-phone-call.jsonl`    | `acceptEdits` | none            | "operations agreed with the city on the phone" | not kept: Claude Code refused again      |
| `record-the-decision/decision.jsonl`              | `acceptEdits` | `Bash(mkdir *)` | the step README's prompt                       | `solution/work/decisions/`               |
| `record-the-decision/unchecked-quote.jsonl`       | `acceptEdits` | `Bash(mkdir *)` and GBFS web fetches | the same prompt without the pasted GBFS text | `wrong/unchecked-quote/work/decisions/` |
| `record-the-decision/no-options.jsonl`            | `acceptEdits` | `Bash(mkdir *)` | the weak prompt in `prompts.md`                | `wrong/no-options/work/decisions/`       |

## Edits made after a run

- Each Markdown file was formatted with `bun run format` before it was signed.
- `problem/work/intent.md` (all three steps) and `problem/work/spec.md` (`record-the-decision`) have a few long sentences split. `plain-english.ts` reads `problem/` files. The product manager signed each one again, so `approvals.jsonl` holds the new hash.

Pictures: each step's `images/expected.png` is `bun run verify <step-name>` after `bun run catch-up <step-name>`, drawn as `scripts/shots.ts` draws a terminal.
