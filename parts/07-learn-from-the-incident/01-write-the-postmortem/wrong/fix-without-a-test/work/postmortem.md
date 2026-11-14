# Postmortem: double wrench in North district

Date of incident: 2026-11-03. Status: resolved. Format: blameless.

Sources: `data/incidents/north-double-wrench/` (`incident.log`, `deploys.log`, `chat.txt`, `availability.csv`, `README.md`). All times are from those logs (UTC).

## Summary

Deploy D-071 turned on the `wrench_disables_bike` flag for North district at 06:14. From then on, every `POST /wrench` opened a repair job and disabled the bike. At 07:40 the rider app started retrying failed `POST /wrench` calls, up to 3 times each. `POST /wrench` has no duplicate check, so every retry counted as a new report. Each one opened another repair job and disabled the bike again. North availability fell from 97.8% to 89.0%, and the North crew queue grew to about 600 jobs (it is normally about 40). The flag was turned off for North at 09:30, and a script re-enabled 212 bikes at 10:20. Availability was back above 96% by the 10:40 sample, and the incident was closed at 10:50/10:51.

## Impact

| Measure | Value | Source |
| --- | --- | --- |
| Bikes taken out of service by duplicate jobs | **212** (the bikes re-enabled by script) | `incident.log` 10:20, `chat.txt` 10:18 |
| North availability before | **97.8%** (every sample 06:00 to 07:30) | `availability.csv` |
| North availability at lowest | **89.0%** (09:00 to 09:30, four samples), a drop of 8.8 points | `availability.csv` |
| Time below 96% | **2 h 40 min**: first sample below at 08:00 (95.6%), first back above at 10:40 (96.7%) | `availability.csv` |
| Time from first drop to resolution | **3 h 10 min**: 07:40 (storm begins, availability 97.0%) to 10:50 (resolved) | `incident.log`, `availability.csv` |
| North crew queue | about **600** open jobs, normally about 40 | `chat.txt` 08:34 |
| Duplicates per bike | each affected bike ID showed up **3** times, a few seconds apart | `chat.txt` 08:47 |

Service levels (`data/contract/sla.yaml`):

- **SLA-9 (96% availability):** North was below the 96% line for 2 h 40 min. SLA-9 is measured across the whole fleet, and these logs only cover North, so they can't show whether the fleet-wide figure was breached.
- **SLA-12 (feed accuracy):** while the duplicates stood, the public feed reported bikes as disabled because of duplicate jobs, not because of separate defect reports.
- **SLA-4 (repair limits):** each duplicate job got its own 48 h wrench deadline. This padded the North crew queue about fifteen times over and buried real jobs in the deadline order.
- **SLA-11 (4 h station outage):** the logs don't break the data down by station, and the whole incident lasted less than 4 h.

Log discrepancies, recorded as found:

- `incident.log` says availability was back above 96% at 10:50. `availability.csv` already shows 96.7% at 10:40. The table above uses the CSV.
- The alert fired at 08:05. The CSV was already below 96% at the 08:00 sample.
- Times in the chat lead the log by about 1–2 minutes (flag off 09:28 vs 09:30, re-enable 10:18 vs 10:20). The chat records when each action was announced, the log records when it took effect.

## Timeline

| Time | Event | Source |
| --- | --- | --- |
| 06:10 | Release pipeline starts deploy D-071: district rollout of `wrench_disables_bike` to North | `deploys.log`, `incident.log` |
| 06:14 | D-071 finishes; `wrench_disables_bike` is on for North | `deploys.log`, `incident.log` |
| 07:40 | Retry storm begins: the rider app retries failed `POST /wrench` up to 3 times; North availability is 97.0% | `incident.log`, `availability.csv` |
| 07:52 | Each retry opens a new repair job and disables the bike again | `incident.log` |
| 08:00 | North availability is 95.6%, the first sample below 96% | `availability.csv` |
| 08:05 | Alert: North bike availability under 96% | `incident.log` |
| 08:20 | On-call engineer acknowledges the alert | `incident.log`, `chat.txt` 08:21 |
| 08:34 | North crew queue has about 600 jobs, normally about 40 | `chat.txt` |
| 08:47 | The same bike IDs appear three times each, a few seconds apart | `chat.txt` |
| 09:00 | North availability reaches its lowest, 89.0% (it stays there until 09:30) | `availability.csv` |
| 09:02 | Team notes that the app retries a wrench when the network drops, and that retries were never tested | `chat.txt` |
| 09:05 | Cause found: `POST /wrench` has no duplicate check, so retries count as new reports | `incident.log`, `chat.txt` |
| 09:28 | Release manager announces the flag is being turned off for North | `chat.txt` |
| 09:30 | `wrench_disables_bike` turned off for North | `deploys.log`, `incident.log` |
| 09:40 | Availability starts recovering (90.1%) | `availability.csv` |
| 10:20 | Script re-enables the 212 bikes that only have duplicate jobs | `incident.log`, `chat.txt` 10:18 |
| 10:40 | North availability is 96.7%, the first sample back above 96% | `availability.csv` |
| 10:50 | North availability back at 97.8%; incident resolved | `incident.log`, `availability.csv`, `chat.txt` 10:51 |

## Contributing factors

1. **`POST /wrench` is not idempotent.** `src/wrenches.ts` inserts a new `wrenches` row and a new `repair_jobs` row (`J-W-<wrench id>`) for every request. Nothing recognises a repeated report for a bike that already has an open wrench job, and the request carries no idempotency key.
2. **The rider app retries on network failure.** When the network drops, the app resends `POST /wrench` up to 3 times. From the client's side, a request that failed may already have been committed on the server, so the retry is a duplicate.
3. **The flag turned duplicates into lost availability.** Before `wrench_disables_bike`, a duplicate report only added a queue row. With the flag on, every report also sets `bikes.is_disabled = 1`, which feeds straight into the GBFS feed and the availability figure.
4. **No test covered retries.** The test suite never sends the same wrench more than once, so neither the duplicate jobs nor the repeated disables showed up before release.
5. **The rollout had no guardrail tied to the effect it could cause.** D-071 went to a whole district. Nothing paused the rollout automatically when availability or queue size moved. The flag stayed on until someone turned it off by hand, 3 h 16 min after the deploy finished.
6. **Alerting watched only availability, and late.** The alert fired at 08:05, after the 08:00 sample was already below 96%. No alert watched the crew queue's size or duplicate jobs per bike, even though the queue was already growing well before then.
7. **There was no built-in way to undo duplicate jobs.** Turning the flag off stopped new disables but didn't re-enable bikes. That took a separate script, which ran 50 minutes after the flag was turned off.

## What went well

- The district-by-district rollout kept the impact to North. No other district had the flag on.
- Turning the flag off worked as a quick mitigation without a code deploy, and availability started recovering at the next sample (09:40).
- Looking at the queue data (600 jobs, the same IDs three times each) led to the cause within 45 minutes of the acknowledgement (08:20 to 09:05).
- QA knowledge of the app's retry behaviour linked the symptom to its cause right away.
- The cleanup only re-enabled bikes whose jobs were all duplicates (212), so bikes with real defects stayed out of service.
- Each log recorded its own part of the incident, so the timeline could be rebuilt from them.

## Action items

| ID | Action | Owner | Check |
| --- | --- | --- | --- |
| A-1 | Add a regression test that sends the same wrench (same `bike_id` and `fault`) to `POST /wrench` three times. It should assert exactly one `wrenches` row and one open `repair_jobs` row for that bike, `is_disabled = 1`, and a non-201 or same-`job_id` reply to each retry. | QA engineer | `bun test -t "same wrench three times"` |
| A-2 | Make `POST /wrench` idempotent: when a report matches an open wrench job for the same bike, return the existing `job_id` and don't insert or disable again. Accept an idempotency key from the app too. Check `data/contract/sla.yaml` first: under SLA-4 the clock starts at the first wrench, so the existing job's `reported_at` must stay as it is. | Engineer | `bun test -t "same wrench three times"` passes against the change |
| A-3 | Send an idempotency key with every wrench report, keep it the same across the app's retries, and back off between retries. | Tech lead | `bun test test/acceptance` includes a retried wrench with one key |
| A-4 | Add an automatic pause to district flag rollouts: turn `wrench_disables_bike` off if district availability falls by more than 2 points or the crew queue more than doubles within 30 min of turning it on. | Release manager | `grep pause scripts/deploy.ts` |
| A-5 | Add alerts for crew queue size per depot and for more than one open wrench job per bike, so a spike like this pages someone before availability drops below 96%. | Operations lead | `curl -s 'localhost:4100/crew/queue?depot=North'` shows no bike with more than one open wrench job |
| A-6 | Write a runbook step and a script that closes duplicate wrench jobs and re-enables bikes that have no other open job, so cleanup isn't improvised next time. | Engineer | `bun test -t "duplicate cleanup"` |
| A-7 | Add "client retries" to the release checklist for any flag that changes what a write endpoint does. | Engineering manager | `grep -i retr work/release.md` |
| A-8 | Ask Brannock City Transport, through the contract owner, how the duplicate-driven drop counts against SLA-9 and SLA-12 for 2026-11-03, and record the answer here. | Product manager | `grep -n "SLA-9" work/postmortem.md` shows the city's ruling |
