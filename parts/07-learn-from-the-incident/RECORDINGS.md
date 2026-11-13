# How this part's end states were made

For course authors. Every Markdown file, test and code change in this part's `solution/` and `wrong/` folders came from a real, headless Claude Code run. Nobody wrote a transcript by hand.

## The begin state

`01-write-the-postmortem/problem/history.bundle` is made by `make-begin-history.ts`:

```bash
bun parts/07-learn-from-the-incident/make-begin-history.ts /tmp/part-7-begin
```

Expect: `Built the Part 7 begin state in /tmp/part-7-begin`

It commits each stage from `world/finished/` in lifecycle order. Each gate is signed by the person who holds the role. The build commits P-1 to P-3 copy the code from the recorded build in `world/finished/history.bundle`. Then it adds the incident logs. Two files differ from `world/finished/` on purpose: `CLAUDE.md` has no retry line yet, and `work/plan.md` has no P-4, because the plan was approved before the incident.

Each later begin state is the end state of the step before. For example, `02-close-the-loop/problem/history.bundle` is the same file as `01-write-the-postmortem/solution/history.bundle`.

## The runs

Every run used Claude Code 2.1.323, signed in, in a clone of the step's begin state. Each one used these flags: `--output-format stream-json --verbose --permission-mode acceptEdits --setting-sources project,local --no-session-persistence`. The prompt is in the step README or in `prompts.md`.

| Saved as                                                                            | Prompt                                          | Extra flags                                                          |
| ----------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| `01-write-the-postmortem/solution/recordings/write-the-postmortem/postmortem.jsonl` | step README, prompt 1                           | `--max-turns 30`                                                     |
| `01-write-the-postmortem/solution/recordings/write-the-postmortem/check-fix.jsonl`  | `prompts.md`, prompt 2                          | `--max-turns 10`                                                     |
| `01-write-the-postmortem/solution/recordings/write-the-postmortem/regression.jsonl` | step README, prompt 2                           | `--allowedTools` for `bun test`, `git add`, `git commit`, `git diff` |
| `01-write-the-postmortem/wrong/blames-the-engineer/recordings/.../blame.jsonl`      | "say who made the mistake" (in `prompts.md`)    | `--max-turns 20`                                                     |
| `01-write-the-postmortem/wrong/fix-without-a-test/recordings/.../no-test.jsonl`     | "Just the fix, we do not need a test for this." | `--allowedTools "Bash(bun test *)"`                                  |
| `02-close-the-loop/solution/recordings/close-the-loop/claude-md-line.jsonl`         | step README, prompt 1                           | `--max-turns 12`                                                     |
| `02-close-the-loop/solution/recordings/close-the-loop/next-intent.jsonl`            | step README, prompt 2                           | `--max-turns 12`                                                     |
| `02-close-the-loop/wrong/claude-md-wall/recordings/.../update-claude-md.jsonl`      | "Update CLAUDE.md with everything we learned"   | `--max-turns 12`                                                     |
| `02-close-the-loop/wrong/intent-without-numbers/recordings/.../short-intent.jsonl`  | "Write ... about two riders. Keep it short."    | `--max-turns 12`                                                     |

## What changed after a run

- `withoutModelNames` from `checks/lib/recordings.ts` on every transcript. The working folder in each transcript reads `/home/user/ai-sdlc-agentic-workflows/kestrel`, as in Part 1.
- The `Co-Authored-By` trailer reads `Claude <noreply@anthropic.com>`, with no model name and no session link, in commits and transcripts.
- `bun run format` on the Markdown and code Claude wrote, so tables line up.
- Approvals were signed as the role holder, the same way `world/sign-finished.ts` signs the finished chain.
- In the `close-the-loop` run, the headless run was not allowed to commit, so the learner committed `CLAUDE.md` with Claude's own message.

## The pictures

```bash
bun parts/07-learn-from-the-incident/take-pictures.ts
```

Expect: `Saved parts/07-learn-from-the-incident/01-write-the-postmortem/images/expected.png`
