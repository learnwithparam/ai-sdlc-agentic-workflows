# Postmortem: the double wrench in North district

## Summary

After the North rollout, the rider app retried failed wrench reports. Each retry opened a new job and disabled the bike again. 212 bikes stayed out of service for 3 hours 10 minutes.

## Impact

- 212 bikes disabled with duplicate jobs.
- 3 hours 10 minutes, from 07:40 to 10:50.
- North bike availability fell from 97.8% to 89.0%, under the 96% contract line.

## Timeline

- 06:10 deploy D-071 starts the North rollout.
- 07:40 the retry storm begins.
- 08:05 alert: North availability under 96 percent.
- 09:05 cause found: POST /wrench has no duplicate check.
- 09:30 the flag is turned off for North.
- 10:50 availability is back above 96 percent.

## Contributing factors

- `POST /wrench` had no duplicate check, so a retry counted as a new report.
- No test sent the same report twice.
- The rollout guardrail stopped new stages but did not turn the flag off by itself.

## What went well

- The district rollout kept the problem in North.
- The flag turned the feature off in one step.

## Action items

- **A-1** Treat a retry with the same `request_id` as one report. Owner: tech lead. Check: `test/regression/retried-wrench.test.ts` passes.
- **A-2** Add one line about retries to "Things Claude gets wrong" in `CLAUDE.md`. Owner: tech lead. Check: `bun run verify close-the-loop`.
- **A-3** Write the next intent: two different riders wrench the same bike. Owner: product manager. Check: `work/intent/next-dedupe-wrenches.md` is approved.
