# Recorded Claude Code runs

Every file here comes from a real, headless Claude Code run. Nobody wrote a transcript by hand.
The only change to a raw transcript is that the `model` field reads `(not shown)`, because no page or recording names a model.

## finished/run-1.jsonl

The build stage of the finished chain. Claude Code built `work/plan.md` on a fresh copy of the chain.

- **Made with:** Claude Code 2.1.323, signed in with a Claude plan.
- **Command:** `bun run finished`, with `claude` signed in and `CI` not set.
- **Folder it runs in:** `.finished-run/`, a fresh copy of `world/kestrel/` with `world/finished/` laid over it and the code put back to its begin state.
- **Headless flags:** see `FINISHED_RUN` and `headlessArguments` in `config/claude-code.ts`.
- **Where the output goes:** the transcript to `.finished-run/recordings/finished/run-1.jsonl`, the code and commits to `.finished-run/`.
- **What we kept:** the transcript in `finished/run-1.jsonl`, the commits in `finished/commits.txt`, the changed files in `world/finished/src/` and the git history in `world/finished/history.bundle`.
- **One change after the run:** `bun run format` on `world/finished/src/`. Biome changed spacing only.

The stage documents in `world/finished/` (`work/*.md`, the skill, the reviewer, `REVIEW.md`, `PLAYBOOK.md`) and the acceptance tests are the course's sample end state, written for the course. The part sessions record a real run for each one as they build the step that makes it.

## ready-the-repo runs

The recorded runs for the `ready-the-repo` step live in that step's `solution/` and `wrong/` folders, under `recordings/ready-the-repo/`.

- **Command:** `bun run record ready-the-repo`, in a `kestrel/` made by `bun run start ready-the-repo`, with the step's `CLAUDE.md`, `AGENTS.md` and `.claude/settings.json` in place.
- **Prompt and flags:** `RECORDED_RUNS["ready-the-repo"]` in `config/claude-code.ts`.
- **Where the output goes:** `kestrel/recordings/ready-the-repo/run-N.jsonl`.

To record them again, a supervisor with a signed-in Claude Code runs the same commands and copies the new files over the old ones.
