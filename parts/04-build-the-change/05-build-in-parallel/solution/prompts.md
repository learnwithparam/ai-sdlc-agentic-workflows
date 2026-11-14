# build-in-parallel: the prompts, what Claude showed, what to check

The code is the recorded code from the step before. A script took the P-2, P-3 and P-4 commits from that recording, put each on its own `slice/` branch, and merged the three into main. That is the shape `claude -w` leaves when you run the slices side by side. The check proves the shape: merge commits named for `slice/` branches, and files that do not overlap. `work/slices.md` was written by hand from `git show --numstat`.

**Check before you merge:** each branch changed one file, and no two branches share a file.

## What to reject

`wrong/one-big-commit/` is one commit with all four items, so nothing was built in a slice. `wrong/edited-the-test/` changed a signed test to get green.
