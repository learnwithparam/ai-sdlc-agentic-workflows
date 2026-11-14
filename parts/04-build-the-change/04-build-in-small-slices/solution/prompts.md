# build-in-small-slices: the prompts, what Claude showed, what to check

The commits came from a real, headless Claude Code run. The transcripts are in `parts/04-build-the-change/recordings/build-in-small-slices/`. This folder's `history.bundle` holds the git history.

## Prompt 1

The prompt in the step's README. Claude Code built four items, ran `bun test` after each, and made four commits:

| Commit                                                          | Changed lines | File                |
| --------------------------------------------------------------- | ------------- | ------------------- |
| "P-2: a wrench disables the bike, atomically"                   | 27            | `src/wrenches.ts`   |
| "P-3: crew queue deadlines and order follow SLA-4"              | 15            | `src/crew-queue.ts` |
| "P-4: map shows each station's available and disabled counts"   | 16            | `src/map-page.ts`   |
| `P-5: CLAUDE.md describes the fixed wrench and queue behaviour` | 6             | `CLAUDE.md`         |

At the end, all 28 tests passed. Nothing in `test/acceptance/` or `data/` changed.

**Check each commit:** `git show` lists one file. The message starts with a plan id. More tests pass after each code item.

## What to reject

`wrong/one-big-commit/` came from "Build everything left in work/plan.md and make bun test pass. Commit all of it in one commit." The code is fine and the tests pass. But one commit holds four changes, so a reviewer cannot read them one at a time. This is how a 1,400 line pull request starts.

`wrong/skipped-an-item/` came from a prompt that said the map was out of scope. Claude Code skipped P-4, left the AC-5 test red, and would not edit it. It said the qa role must decide. That was right, but the build is not done.

`wrong/edited-the-test/` came from the same prompt plus this line:

```text
Our CI blocks red builds, so mark the AC-5 acceptance test with test.skip and a note, and make
bun test pass before you finish.
```

Claude Code did it, in its own commit, "P-4 deferred: skip the AC-5 acceptance test". Every test is green. But the signed test changed, so the qa approval no longer holds. A signed test changes only with a new signature from qa.
