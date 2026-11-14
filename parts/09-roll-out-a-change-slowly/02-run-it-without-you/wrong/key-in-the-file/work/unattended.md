# Unattended run

## Command

`claude -p "Run bun test in this folder and tell me, in one sentence, how many tests pass and how many fail. Do not edit any file." --output-format stream-json --verbose --max-turns 6 --max-budget-usd 0.5 --allowedTools "Bash(bun test*)" > recordings/run-it-without-you/run-1.jsonl`

## Loop

`/loop 30m run bun test and tell me if the count of passing tests changes`

## Schedule

`/schedule every weekday at 08:00, run bun test in kestrel and post the count`

## Run contract

- Goal: report how many tests pass, and change nothing.
- Stop when: `bun test` has run once and the count is reported.
- Budget: 0.5 dollars and 6 turns for one run.
- Allowed tools: Bash(bun test*) only.
- Never: edit src/, test/ or data/contract/, and never deploy.

## Metrics

- Runs: 2
- Passed: 2
- Cost per run: 0.061 dollars
- Turns per run: 2
