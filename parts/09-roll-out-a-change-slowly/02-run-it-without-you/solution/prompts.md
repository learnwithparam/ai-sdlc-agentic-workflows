# run-it-without-you: the prompts, what Claude showed, what to check

The two saved runs in `solution/recordings/run-it-without-you/` are real headless runs of the command in the step page, with the model name replaced. The cost and turn counts in `work/unattended.md` are the means of those two runs.

`work/unattended.md` and `work/review-action.yml` were written by hand. The workflow has not been run on GitHub: the check proves its shape, not that the action works with your account.

## What to check

- The stop condition is a command, not a feeling.
- Each saved run cost less than the money limit and used fewer turns than the turn limit.
- The workflow reads contents only and takes its key from `secrets`.

## What to reject

- `wrong/made-up-metrics/`: the cost and turn counts do not match the runs.
- `wrong/key-in-the-file/`: a key typed into the workflow. Anyone who can read the repo can use it.
