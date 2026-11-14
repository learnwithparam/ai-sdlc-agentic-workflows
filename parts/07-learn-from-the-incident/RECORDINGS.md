# How this part's end states were made

For course authors. Every Markdown file, test and code change in this part's `solution/` and `wrong/` folders came from a real, headless Claude Code run. Nobody wrote a transcript by hand.

## The begin state

`01-write-the-postmortem/problem/history.bundle` is made by `make-begin-history.ts`:

```bash
bun parts/07-learn-from-the-incident/make-begin-history.ts /tmp/part-7-begin
```

Expect: `Built the Part 7 begin state in /tmp/part-7-begin`

It starts from the end of Part 4, so the ticket and the spec are the same ones the learner built. It lays the signed output of Parts 5 and 6 on top, then adds the incident logs. Nothing comes from `world/finished/`.

Each later begin state is the end state of the step before. For example, `02-close-the-loop/problem/history.bundle` is the same file as `01-write-the-postmortem/solution/history.bundle`.

## The runs

Every run used Claude Code 2.1.323, signed in, in a clone of the step's begin state. Each one used these flags: `--output-format stream-json --verbose --permission-mode acceptEdits --setting-sources project,local --no-session-persistence`. The prompt is in the step README or in `prompts.md`.

| Saved as                                                                            | Prompt                                                          | Extra flags                                                          |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| `01-write-the-postmortem/solution/recordings/write-the-postmortem/postmortem.jsonl` | step README, prompt 1                                           | `--max-turns 30`                                                     |
| `01-write-the-postmortem/solution/recordings/write-the-postmortem/regression.jsonl` | step README, prompt 2                                           | `--allowedTools` for `bun test`, `git add`, `git commit`, `git diff` |
| `01-write-the-postmortem/wrong/blames-the-engineer/recordings/.../blame.jsonl`      | "name the people from chat.txt" (hand edited, see `prompts.md`) | `--max-turns 20`                                                     |
| `01-write-the-postmortem/wrong/fix-without-a-test/recordings/.../no-test.jsonl`     | "Just the fix, we do not need a test for this."                 | `--allowedTools "Bash(bun test *)"`                                  |
| `02-close-the-loop/solution/recordings/close-the-loop/claude-md-line.jsonl`         | step README, prompt 1                                           | `--max-turns 12`                                                     |
| `02-close-the-loop/solution/recordings/close-the-loop/next-intent.jsonl`            | step README, prompt 2                                           | `--max-turns 12`                                                     |
| `02-close-the-loop/wrong/claude-md-wall/recordings/.../update-claude-md.jsonl`      | "Update CLAUDE.md with everything we learned"                   | `--max-turns 12`                                                     |
| `02-close-the-loop/wrong/intent-without-numbers/recordings/.../short-intent.jsonl`  | "Write ... about two riders. Keep it short."                    | `--max-turns 12`                                                     |

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

## Re-recorded on the Part 4 ticket

The runs in this part were recorded again on the Part 4 repo. Two limits to know: the `blames-the-engineer` run held to blameless even when asked, so that sample is a hand edit of the real postmortem, and the first run of the action items check refused the word Ask, so `ask` was added to the verb list in `checks/write-the-postmortem.ts`.
