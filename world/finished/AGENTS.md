# Team rules for every coding agent

These rules hold for Claude Code and for any other agent that works in this repo.

- Never edit `data/contract/`. The city owns the contract.
- Never change a file in `test/acceptance/` after QA approved it. Change the code instead.
- Never run `bun run deploy:production` until the release manager approved `work/rollout.yaml`.
- Never run `bun run approve`. An approval is a person's decision.
- Start from the approved file of the stage before: intent, spec, decision, plan.
