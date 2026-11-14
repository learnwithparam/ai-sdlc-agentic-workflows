# Postmortem: double wrench in North district (2026-11-03)

Blameless. This document describes how the system and our process allowed the incident. It does not assign fault to any person. All times are UTC, from `data/incidents/north-double-wrench/`.

## Summary

Deploy D-071 turned on the `wrench_disables_bike` flag for North at 06:14. When a rider reports a wrench, this flag disables the bike. From 07:40 the rider app retried `POST /wrench` (up to 3 times) whenever the network dropped. `POST /wrench` has no duplicate check, so each retry opened a new repair job and disabled the bike again. The North crew queue grew to about 600 jobs, when about 40 is normal. North availability fell from 97.8% to 89.0%, which is under the SLA-9 minimum of 96%. On-call turned the flag off for North at 09:30. A script re-enabled 212 bikes at 10:20, and the incident was resolved at 10:50.

## Impact

| Measure | Value | Source |
| --- | --- | --- |
| Bikes taken out of service by duplicate jobs only | **212** | `incident.log` 10:20, `chat.txt` 10:18 |
| Incident duration (retry storm to resolved) | **3 h 10 min** (07:40 to 10:50) | `incident.log` |
| Time North was under SLA-9 (96%) | **about 2 h 40 min** (first reading under 96% at 08:00, first reading back above at 10:40) | `availability.csv` |
| North availability before | **97.8%** (06:00 to 07:30) | `availability.csv` |
| North availability at its lowest | **89.0%** (09:00 to 09:30), 8.8 points down and 7.0 points under the SLA-9 line | `availability.csv` |
| Crew queue for North | about 600 jobs, normally about 40 | `chat.txt` 08:34 |

Contract exposure: SLA-9 (bike availability, at least 96%) was breached in North. The duplicate jobs also filled the SLA-4 queue, each with a 48-hour wrench deadline, so real defect reports were buried among them. We need to check whether any real wrench in the window went past its deadline.

## Timeline

| Time | Event |
| --- | --- |
| 06:10 | Deploy D-071 starts. The release pipeline rolls out `wrench_disables_bike` to North. |
| 06:14 | D-071 finishes. The flag is on for North. |
| 07:40 | Retry storm begins. The rider app retries failed `POST /wrench` up to 3 times. North availability drops to 97.0%. |
| 07:52 | Each retry opens a new repair job and disables the bike again. |
| 08:00 | North availability is 95.6%, the first reading under 96%. |
| 08:05 | Alert: North bike availability under 96 percent. |
| 08:20 | On-call engineer acknowledges the alert (chat 08:21: "looking at the North availability alert now"). |
| 08:34 | Crew queue for North has 600 jobs, normally about 40. |
| 08:47 | The same bike ids appear three times each, a few seconds apart. |
| 09:00 | North availability reaches its lowest point, 89.0%. It stays there until 09:30. |
| 09:02 | Team notes the app retries wrenches when the network drops, and that retries were never tested. |
| 09:05 | Cause found: `POST /wrench` has no duplicate check, so retries count as new reports. |
| 09:30 | Flag `wrench_disables_bike` turned off for North (chat 09:28). |
| 09:40 | Availability starts to recover (90.1%). |
| 10:20 | Script re-enables the 212 bikes that only have duplicate jobs (chat 10:18). |
| 10:40 | North availability is 96.7%, the first reading back above 96%. |
| 10:50 | North availability is back above 96 percent. Incident resolved (availability 97.8%). |

Note: `incident.log` puts recovery above 96% at 10:50, but `availability.csv` already shows 96.7% at 10:40. Chat and log times differ by 1 to 2 minutes. This timeline uses the log time first.

## Contributing factors

1. **`POST /wrench` is not idempotent.** `src/wrenches.ts` inserts a new `wrenches` row and a new `J-W-<id>` repair job on every call. It does not check whether this bike already has an open wrench from a few seconds earlier, and it accepts no idempotency key.
2. **The client retries an operation that is not safe to repeat.** The rider app retries a failed `POST /wrench` up to 3 times. When the first request had already succeeded on the server, each retry made a duplicate.
3. **Retries were never tested.** There is no test that sends the same wrench twice (chat 09:02). The only test file is `test/feed.test.ts`.
4. **The new flag made duplicates much worse.** Before D-071, a duplicate wrench only added a row to the queue. With `wrench_disables_bike` on, every duplicate also took a bike out of service.
5. **The rollout had no guardrail.** D-071 went to a whole district, and nothing checked availability or queue size to stop it automatically. The storm ran for 1 h 50 min before the flag was turned off.
6. **The alert threshold was the same as the contract line.** The alert fired at 96%, which is the SLA-9 minimum, so we were already in breach when we got paged (25 minutes after the storm began). Nothing alerted on the crew queue growing from about 40 to about 600 jobs.
7. **Recovery was manual.** There was no ready-made tool to find bikes that only have duplicate jobs. The re-enable script was written during the incident, 50 minutes after the flag was turned off.
- Raj Patel never tested a retry, and Sam Achebe turned the flag on without checking.

## What went well

- The on-call engineer acknowledged the alert within 15 minutes (08:05 to 08:20).
- Looking at the crew queue (08:34) and noticing the repeated bike ids (08:47) led to the cause by 09:05, 45 minutes after acknowledging the alert.
- The district feature flag gave us a fast, contained way to stop the damage. Only North was affected.
- Bikes were re-enabled precisely: only the 212 bikes whose jobs were all duplicates. Bikes with a real defect stayed disabled.
- The team posted clear, timestamped updates in the incident channel, which made this timeline possible to rebuild.

## Action items

| ID | Action | Owner | Check |
| --- | --- | --- | --- |
| A-1 | Write a regression test that sends the same wrench (same bike, same rider report) to `POST /wrench` three times. It should assert one `wrenches` row, one open `repair_jobs` row, and one crew-queue entry for that bike, with the test DB and log in temp files. | Backend engineer (spoke) | `bun test -t "same wrench three times"` |
| A-2 | Make `POST /wrench` idempotent: accept an idempotency key from the app and treat a repeat of an open wrench for the same bike as the same report, returning the existing job and not writing again. Keep the SLA-4 clock on the first report. | Backend engineer (spoke) | `bun test test/wrenches.test.ts` |
| A-3 | Send a stable idempotency key with every wrench attempt in the rider app, and add a dropped-network retry case to the app's release tests. | Mobile app engineer | `grep -n "Idempotency-Key" <rider-app wrench client>` |
| A-4 | Add an automatic stop to district flag rollouts, so the flag turns off if district availability drops by more than 1 point or the crew queue doubles within 30 minutes. | Release engineer | `bun test -t "rollout auto-stops"` |
| A-5 | Add an early-warning alert at 97% district availability, plus an alert on crew queue size per depot, so we page before SLA-9 is breached. | On-call lead / SRE | `bun test -t "queue spike alert"` |
| A-6 | Turn the 10:20 re-enable script into a reviewed, tested tool in the repo, and add it to the on-call runbook. | On-call lead / SRE | `bun test -t "re-enable duplicate-only bikes"` |
| A-7 | Check every real (non-duplicate) wrench in North from 07:40 to 10:50 against its SLA-4 deadline, and report any credit exposure to the city. | Operations manager | `bun test -t "SLA-4 audit north-double-wrench"` |

The fix and tests are not written yet. The Check commands name tests that A-1 to A-7 will add.
