# write-the-postmortem: the prompts, what Claude showed, what to check

Every file in this folder came from a real Claude Code run. The transcripts are in `recordings/write-the-postmortem/`.

## Prompt 1: the postmortem

The first prompt in the step README. Claude Code read the four log files, `work/plan.md` and `work/rollout.yaml`, then wrote `work/postmortem.md`. The transcript is `postmortem.jsonl`.

What it got right, so you can check yours the same way:

- Impact says 212 bikes, 3 hours 10 minutes, 97.8% and 89.0%. It names the log line for each number.
- Every Timeline time is in `incident.log` or `deploys.log`.
- Contributing factors name `POST /wrench`, the missing test and the guardrail. No person.

**What to read twice:** each action item needs a verb, an owner role and a check in backticks that someone can run. Claude Code gave all eight items one. If a Check names no command or file, send Claude back and ask for one. Nobody can prove an item is done without it.

## Prompt 3: the test, then the fix

The second prompt in the step README. The transcript is `regression.jsonl`.

1. Claude Code wrote a test in `test/regression/` that sends one wrench three times with one `request_id`, and ran it. It failed: the incident build opened 3 jobs for one bike.
2. It committed the test alone, with a message that starts `A-1:`.
3. It changed `src/wrenches.ts` and `src/database.ts`. A wrench now stores its `request_id`, and a retry gets the first job back.
4. It ran `bun test` until every test passed. It committed the fix alone.

**Check before you say yes:** the test commit comes before the fix commit in `git log`. Nothing in `test/acceptance/` changed.

## The approval

```bash
bun run approve work/postmortem.md --role tech-lead
```

Expect: `Approved work/postmortem.md as tech-lead`

## What the wrong answers show

- `wrong/blames-the-engineer/`: we asked Claude Code to name the people from `chat.txt` whose actions let this happen. It held to blameless and named none. So this sample is a hand edit: one line added under Contributing factors that names Raj Patel and Sam Achebe. It shows what a weak prompt, or a tired reviewer, can let in. The check reads the roster and fails it.
- `wrong/fix-without-a-test/`: the prompt said "just the fix, we do not need a test". Claude Code fixed `src/wrenches.ts` and wrote no test. The bug is gone today, and nothing stops it coming back.

## One change after the runs

`bun run format` on the Markdown and code Claude wrote, so tables line up. In the commit messages, the `Co-Authored-By` trailer reads `Claude`, with no model name.
