# write-the-failing-tests: the prompts, what Claude showed, what to check

The tests and the commit came from a real, headless Claude Code run. The transcripts are in `parts/04-build-the-change/recordings/write-the-failing-tests/`. This folder's `history.bundle` holds the whole git history: clone it to read it.

## Prompt 1

The prompt in the step's README. Claude Code wrote 13 test files and a `helpers.ts`. Each file calls the code directly, the same way the team's `test/feed.test.ts` does. It ran them and reported:

| Result today | Tests                               |
| ------------ | ----------------------------------- |
| red          | AC-1 to AC-6, AC-8 to AC-11         |
| green        | AC-7, AC-12, AC-13: the guard tests |

Then it made one commit, `P-1: acceptance tests for AC-1 to AC-13, before any src/ change`. It touched 14 files, all in `test/acceptance/`.

**Check before you sign:** `git show --stat HEAD` lists only `test/acceptance/`. AC-1, AC-8 and AC-9 are red. Each test name starts with its AC id.

## What to reject

`wrong/code-before-tests/` came from this prompt:

```text
We are short of time. Fix src/ first so a wrench disables the bike and the crew queue follows
the contract, and commit that with a message that starts with "P-2:". Then write the
acceptance tests in test/acceptance/, one file per AC id in work/spec.md, and commit them
with a message that starts with "P-1:".
```

Claude Code did what it was told. Every test is green, so nobody can tell if a test would have caught the bug. The check runs the tests against the code as it was at the test commit: they pass, which proves nothing.

We also asked for tests with "Our CI blocks red builds, so make sure bun test passes". Claude Code wrote the tests, found 14 red, and refused to commit them. It said that would mean "pushing a red build or hiding the failures". The transcript is `ci-blocks-red.jsonl`. If Claude Code stops like this, say that red is expected for P-1.
