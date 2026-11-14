# How this part's end states were made

For course authors. Every Markdown file in this part's `solution/` and `wrong/` folders came from a real, headless Claude Code run. Nobody wrote a transcript by hand.

## The begin state

`01-measure-the-lifecycle/problem/history.bundle` is the end of Part 7, on the Part 4 ticket. It holds the whole lifecycle in git, from the Part 4 build to `approve: work/intent/next-dedupe-wrenches.md by pm`. The CLAUDE.md line, the next intent and the approval were committed after the Part 7 runs.

Each later begin state is the end state of the step before. For example, `03-ship-the-feature/problem/history.bundle` is the same file as `02-write-the-team-playbook/solution/history.bundle`. After `measure-the-lifecycle`, the learner committed `work/metrics.md` with the message `Add the lifecycle numbers in work/metrics.md`.

## The runs

Every run used Claude Code 2.1.323, signed in, in a clone of the step's begin state. Each one used these flags: `--output-format stream-json --verbose --permission-mode acceptEdits --setting-sources project,local --no-session-persistence`. The prompt is in the step README or in `prompts.md`.

| Saved as                                                                                  | Prompt                                  | Extra flags                                                                                 |
| ----------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `01-measure-the-lifecycle/solution/recordings/measure-the-lifecycle/metrics.jsonl`        | step README                             | `--max-turns 40`, `--allowedTools` for `git log`, `git show`, `bun -e`, `awk`, `sort`, `wc` |
| `01-measure-the-lifecycle/wrong/dora-only/recordings/measure-the-lifecycle/speedup.jsonl` | in `prompts.md`                         | `--max-turns 25`                                                                            |
| `02-write-the-team-playbook/solution/recordings/write-the-team-playbook/playbook.jsonl`   | step README                             | `--max-turns 20`                                                                            |
| `02-write-the-team-playbook/wrong/ideal-playbook/recordings/.../ideal.jsonl`              | in `prompts.md`                         | `--max-turns 15`                                                                            |
| `03-ship-the-feature/solution/recordings/ship-the-feature/chain.jsonl`                    | step README                             | `--max-turns 20`                                                                            |
| `03-ship-the-feature/wrong/playbook-edited-after-approval/recordings/.../polish.jsonl`    | "Polish the wording of PLAYBOOK.md ..." | `--max-turns 10`                                                                            |

## What changed after a run

- `withoutModelNames` from `checks/lib/recordings.ts` on every transcript. The working folder in each transcript reads `/home/user/ai-sdlc-agentic-workflows/kestrel`, as in Part 1.
- `bun run format` on the Markdown Claude wrote, so tables line up.
- Approvals were signed as the role holder, the same way `world/sign-finished.ts` signs the finished chain.

## The pictures

```bash
bun parts/08-run-the-team/take-pictures.ts
```

Expect: `Saved parts/08-run-the-team/01-measure-the-lifecycle/images/expected.png`

## The new step

`04-ship-in-your-own-repo` was recorded on a small tool called `pantry`, which is not part of Kestrel. The five transcripts are the five moves in its `prompts.md`. The two `wrong/` samples are hand edits of the real evidence file.
