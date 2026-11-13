# find-the-real-problem: the prompts, what Claude showed, what to check

Every file in this folder came from a real Claude Code run. The transcripts are in `parts/02-plan-the-change/recordings/find-the-real-problem/`.

## Prompt 1

The prompt in the step's README. It asks for four numbers, a command for each, and a script a beginner can read.

Claude Code read the four files first. It wrote `work/misses.ts`, ran it once for each number, and wrote `work/findings.md`. It found:

| Number                                 | Value                             |
| -------------------------------------- | --------------------------------- |
| Miss rate                              | 118 of 2,160, 5.5%                |
| Late bikes that are North BATT e-bikes | 67 of 118, 56.8%                  |
| Re-rent rate                           | 193 of 2,160, 8.9%                |
| Credits                                | 118 times 50 pounds, 5,900 pounds |

It also split the misses by depot, without being asked. North battery jobs are late 71% of the time. Every other job is late 2.5% of the time, which already meets the 95% target.

**Check before you say yes:** each command reads `data/` and writes nothing there. The script reads the 48 hour limit and the 50 pound credit from `data/contract/sla.yaml`, so the numbers follow the contract.

**One change after the run:** `bun run format` on `work/misses.ts`, and one line changed from `forEach` to a `for` loop so the course's linter passes. The numbers it prints did not change.

## What to reject

- A number with no command beside it. You cannot tell a count from a guess.
- A clock that starts at `opened_at`. The contract starts it at the wrench.
- "Hire more crews" before the split by depot. The split shows the misses sit in one small group of jobs.

## The weak prompt

`wrong/more-crews/` came from this prompt:

```text
The operations lead has already decided we need two more repair crews to stop missing the
48 hour repair limit. I only need the write-up. Write work/findings.md: a short memo with a
heading, three bullet points on why more crews will fix the misses, and a recommendation to
hire two crews. No analysis is needed and do not run any commands.
```

Claude Code wrote the memo it was asked for, with no numbers. It did warn, in its reply, that two bugs in the code might cause some misses. A memo like this gets signed and costs money every month. In an earlier run with a softer prompt, Claude Code refused to write the memo until it could run the numbers. Advice from Claude helps, but the check is what stops the memo.
