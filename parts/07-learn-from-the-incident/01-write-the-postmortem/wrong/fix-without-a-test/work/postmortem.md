# Postmortem: the double wrench incident in North district

Date of incident: 2026-11-03. All times are UTC.
Sources: `data/incidents/north-double-wrench/` (`incident.log`, `deploys.log`, `chat.txt`, `availability.csv`) and `work/rollout.yaml`.
This postmortem is blameless. It names systems and missing checks, not people.

## Summary

Deploy D-071 turned on the `wrench_disables_bike` flag for North district, the first stage of the district rollout.
With the flag on, every wrench report opens a repair job and disables the bike.
When the network dropped, the rider app retried a failed `POST /wrench` up to 3 times.
`POST /wrench` has no duplicate check, so it treated each retry as a new report. It opened a new repair job and disabled the bike again each time.
The North crew queue filled with duplicate jobs, and 212 bikes that only had duplicate jobs were taken out of service.
North availability fell from 97.8% to 89.0%, under the 96% guardrail in `work/rollout.yaml`.
Turning the flag off for North stopped new duplicates. A script then re-enabled the 212 bikes, and availability returned to its normal level.

## Impact

| Measure                                      | Value                                                                                                            | How it was worked out                                                                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Bikes taken out of service by duplicate jobs | 212                                                                                                              | `incident.log` 10:20: "script re-enables 212 bikes with duplicate jobs"                                                                       |
| How long it lasted                           | 3 hours 10 minutes (07:40 to 10:50)                                                                              | `incident.log` 07:40 "retry storm begins" to 10:50 "incident resolved". `availability.csv` agrees: first drop at 07:40, back to 97.8 at 10:50 |
| Time under the 96% guardrail                 | 2 hours 40 minutes by `availability.csv` (08:00 to 10:40), 2 hours 45 minutes by `incident.log` (08:05 to 10:50) | first and last rows under 96 in `availability.csv`; the alert and resolve lines in `incident.log`                                             |
| North availability before the incident       | 97.8%                                                                                                            | `availability.csv`, every row from 06:00 to 07:30                                                                                             |
| North availability at its lowest             | 89.0%, a drop of 8.8 points                                                                                      | `availability.csv`, 09:00 to 09:30 (4 readings)                                                                                               |

Notes on the numbers:

- An 8.8 point drop caused by 212 bikes implies a North fleet of about 2,400 bikes (212 / 0.088 ≈ 2,409). This is a cross-check, not a measured figure.
- The crew queue held about 600 North jobs against a normal level of about 40 (`chat.txt`). That fits roughly 200 bikes with 3 jobs each.
- `availability.csv` is back above 96 at 10:40 (96.7). `incident.log` records the recovery at 10:50, the reading where availability is back to its baseline of 97.8.
- The North crew also lost time on the duplicate jobs, and riders saw fewer bikes during the morning peak. These were not measured separately.

## Timeline

Times come from `incident.log` and `deploys.log`. The timeline starts at the retry storm.

| Time  | Event                                                                                                                              |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 07:40 | Retry storm begins: the rider app retries failed `POST /wrench` up to 3 times. Availability goes from 97.8 to 97.0.                |
| 07:52 | Each retry opens a new repair job and disables the bike again.                                                                     |
| 08:05 | Alert: North bike availability under 96 percent.                                                                                   |
| 08:20 | On-call engineer acknowledges the alert.                                                                                           |
| 09:05 | Cause found: `POST /wrench` has no duplicate check, so retries count as new reports.                                               |
| 09:30 | Flag `wrench_disables_bike` turned off for North (`deploys.log` and `incident.log`). Availability stays at 89.0, the lowest point. |
| 10:20 | Script re-enables 212 bikes with duplicate jobs.                                                                                   |
| 10:50 | North bike availability back above 96 percent. Incident resolved.                                                                  |

## Contributing factors

1. **`POST /wrench` is not idempotent.** `src/wrenches.ts` has no duplicate check. It treats a retry of the same report as a new report, opening a new repair job and disabling the bike again.
2. **No test covers a retried wrench.** The acceptance tests in `test/acceptance/` (AC-1 to AC-4) send each wrench once. No test sends the same wrench twice, so the missing duplicate check could ship.
3. **The rider app retries without an idempotency key.** The app retries a failed `POST /wrench` up to 3 times. Each retry looks like a new request to spoke, so the server cannot tell it is a repeat.
4. **The flag made the duplicate costly.** Before `wrench_disables_bike`, a duplicate report only added a queue entry. With the flag on, each duplicate also disables a bike, so the missing check turned into lost availability.
5. **The rollout guardrail was not enforced automatically.** `work/rollout.yaml` says to roll back when `bike_availability_percent` stays under 96 for 10 minutes. `availability.csv` was under 96 at 08:00 and 08:10, but nothing paused the rollout. The flag was turned off by hand at 09:30, about 80 minutes later. The rollback command in `rollout.yaml` (`bun run rollback`) rolls back the release, not the flag for one district.
6. **No alert on the crew queue size.** The North queue reached about 600 jobs against a normal level of about 40. No check compares queue size or duplicate jobs per bike with normal levels. Only the later availability alert picked it up.
7. **The availability alert fires late.** The alert threshold is 96%, and normal is 97.8%. The drop began at 07:40, but the alert only fired at 08:05, 25 minutes later.
8. **No ready-made tool to undo duplicate jobs.** Re-enabling the bikes needed a script written during the incident, 50 minutes after the flag was turned off.

## What went well

- The availability alert fired and was acknowledged 15 minutes later.
- The investigation went from the symptom to the cause in 45 minutes (08:20 to 09:05). The team saw the same bike ids three times, a few seconds apart, and linked that to the app's retry behaviour.
- The feature flag let the team turn the change off for North alone, with no redeploy and no effect on other districts.
- The district rollout limited the impact to North. East, Centre, South and West never had the flag on.
- The re-enable script only touched bikes whose jobs were all duplicates, so bikes with a real fault stayed out of service.
- The team kept a timestamped log and chat during the incident, which made this postmortem possible.

## Action items

| ID  | Action                                                                                                                                               | Owner                  | Check                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | Add a regression test in `test/regression/` that sends the same wrench to `POST /wrench` three times and expects one repair job and one disable.     | Spoke tech lead        | `bun test test/regression/` runs the test; it fails today and passes after A-2.                                                                                |
| A-2 | Make `POST /wrench` idempotent in `src/wrenches.ts`: a repeat of the same report returns the existing job instead of opening a new one.              | Spoke backend engineer | `bun test` passes, including the A-1 test in `test/regression/`.                                                                                               |
| A-3 | Send an idempotency key with every wrench report from the rider app, the same key on each retry, and document it as a field of `POST /wrench`.       | Rider app tech lead    | `work/spec.md` lists the key as a field of `POST /wrench`, and the A-1 test sends it.                                                                          |
| A-4 | Enforce the `rollout.yaml` guardrails automatically: turn the flag off for the district when `bike_availability_percent` is under 96 for 10 minutes. | Release manager        | `work/rollout.yaml` has a flag-off action for each stage, and `bun test test/regression/` includes a test that crosses the guardrail and sees the flag go off. |
| A-5 | Add an alert when a depot's crew queue grows well above normal, or when one bike has more than one open job.                                         | On-call lead           | `bun test test/regression/` includes a test that loads a queue of 600 North jobs and expects the alert.                                                        |
| A-6 | Turn the 10:20 re-enable script into a checked-in runbook tool that re-enables bikes whose open jobs are all duplicates.                             | On-call lead           | The script is in `scripts/`, and a runbook file in `docs/runbooks/` links to it.                                                                               |
| A-7 | Review the availability alert threshold against the 97.8% baseline, so a drop is seen before it reaches the contract line.                           | On-call lead           | `bun test test/regression/` includes a test that replays `data/incidents/north-double-wrench/availability.csv` and expects the alert before 08:00.             |

The test and the fix are not written yet. A-1 comes first so that A-2 can be shown to work.
