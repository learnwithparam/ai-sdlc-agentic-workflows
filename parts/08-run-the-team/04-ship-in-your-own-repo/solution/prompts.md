# ship-in-your-own-repo: the prompts, what Claude showed, what to check

Every file in this folder came from real Claude Code runs. We used a small tool, `pantry`, that lists food and the days left before it expires. It is not part of Kestrel. The transcripts are in `recordings/ship-in-your-own-repo/`.

## The moves

| Move             | Transcript    | What Claude Code did                                                                                                    |
| ---------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Ticket and spec  | `spec.jsonl`  | Wrote `SPEC.md` with AC-1 to AC-3, each with a WHEN and a THEN. It wrote no code.                                        |
| Failing tests    | `tests.jsonl` | Wrote one test for each criterion and ran them: 2 tests failed. It committed the spec and tests as `P-1:`.              |
| Small commits    | `build.jsonl` | Made two commits, `P-2:` and `P-3:`, and ran the tests after each. All 4 tests passed at the end.                        |
| Review           | `review.jsonl`| Read the commits in plan mode as a reviewer. It found one Important problem, described below.                            |
| The evidence file| `write-up.jsonl` | Wrote `work/own-repo.md` from `SPEC.md`, `git log` and a test run.                                                   |

## What the review found

The reviewer ran the code at two fixed times in two time zones. It found that the expired check compares a date in UTC with the local time. Outside UTC, an item that expires today can print `EXPIRED`, and one that expired yesterday can print `0 days`. All the tests passed, because they fix "today" at midnight UTC.

This is the same kind of bug as the clock change in Part 5, on code the course never saw. The tests passed, and a fresh reader still found it. Claude Code wrote in the Review section that it would fix the check and add tests at other times of day. A person decides whether that comes before the merge.

## What to check before you sign

- **The red line is real.** `2 fail` on the first commit means the tests failed before any code change. Run `git checkout` on that commit in your repo and see the same count.
- **The commit sizes are copied from git.** Each line comes from `git show --shortstat`.
- **The review has a finding you can open.** If it says "no findings" for a real change, send the reviewer back once.

## What the wrong answers show

These two are hand edits of the real file, made to show one mistake each.

- `wrong/no-red-run/`: the Red bullet is gone. It shows green only. A test that was never seen failing proves nothing.
- `wrong/one-big-commit/`: the two build commits are merged into one with 612 changed lines. Nobody can review that in one read.
