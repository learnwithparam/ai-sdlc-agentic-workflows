# Postmortem: double wrench in North district

- Date: 2026-11-03 (all times UTC)
- Status: draft for review
- Sources: `data/incidents/north-double-wrench/` (`chat.txt`, `incident.log`, `deploys.log`, `availability.csv`)
- Format: blameless. This document explains how the system let the failure happen. It does not assign fault to people.

## Summary

Deploy D-071 turned on the `wrench_disables_bike` flag for North district at 06:14. From 07:40 the rider app retried failed `POST /wrench` calls up to 3 times. The endpoint has no duplicate check, so every retry opened a new repair job and disabled the bike again. North availability dropped below the 96 percent guardrail at 08:00 and bottomed out at 89.0 percent. The team found the cause at 09:05, turned the flag off for North at 09:30, and re-enabled the 212 bikes that had only duplicate jobs. Availability was back above 96 percent at 10:50.

## Impact

- **Riders:** North availability was under the 96 percent guardrail from 08:00 to about 10:40, roughly 2 h 40 min. It stayed at its lowest, 89.0 percent, from 09:00 to 09:30 (`availability.csv`).
- **Bikes:** 212 bikes were out of service with only duplicate repair jobs, meaning nothing was wrong with them.
- **Crews:** the North crew queue held about 600 jobs against a normal of about 40. Each affected bike showed up about three times.
- **Scope:** North only. The rollout had not reached East, Centre, South or West yet.
- **Open question:** the duplicate jobs may count toward the 48-hour repair clock in the city contract. Each one started its clock at its own wrench. Someone should confirm with the city how to report them.

## Timeline

| Time  | Event                                                                                                              | Source                              |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| 06:10 | Release pipeline starts deploy D-071: `wrench_disables_bike` for North                                             | deploys.log                         |
| 06:14 | D-071 finished. Flag on for North                                                                                  | deploys.log                         |
| 07:40 | Retry storm begins: the rider app retries failed `POST /wrench` up to 3 times. Availability goes from 97.8 to 97.0 | incident.log, availability.csv      |
| 07:52 | Each retry opens a new repair job and disables the bike again                                                      | incident.log                        |
| 08:00 | Availability is 95.6 percent, under the 96 percent guardrail                                                       | availability.csv                    |
| 08:05 | Alert fires: North bike availability under 96 percent                                                              | incident.log                        |
| 08:10 | Guardrail has been crossed for 10 minutes. `rollout.yaml` says roll back now. No rollback happens                  | availability.csv, work/rollout.yaml |
| 08:20 | On-call acknowledges the alert. Sam Achebe starts investigating at 08:21                                           | incident.log, chat                  |
| 08:34 | Ines Moreau: the North crew queue has 600 jobs, normal is about 40                                                 | chat                                |
| 08:47 | Sam Achebe: the same bike ids appear three times each, a few seconds apart                                         | chat                                |
| 09:00 | Availability bottoms out at 89.0 percent and stays there until 09:30                                               | availability.csv                    |
| 09:02 | Raj Patel: the app retries a wrench when the network drops, and retries were never tested                          | chat                                |
| 09:05 | Cause found: `POST /wrench` treats every retry as a new report                                                     | incident.log, chat                  |
| 09:28 | Mei Tanaka turns the flag off for North. Logged at 09:30                                                           | chat, deploys.log                   |
| 09:40 | Availability starts to recover                                                                                     | availability.csv                    |
| 10:18 | Sam Achebe starts re-enabling the 212 bikes with only duplicate jobs. Script logged at 10:20                       | chat, incident.log                  |
| 10:50 | Availability is 97.8 percent. Ines Moreau closes the incident                                                      | incident.log, chat                  |

**Key intervals**

- Storm start to alert: 25 min
- Alert to acknowledgement: 15 min
- Acknowledgement to cause: 45 min
- Guardrail breach to flag off: 90 min (the rollout plan allowed 10)
- Flag off to resolution: 80 min

## Contributing factors

These are gaps in the system, not individual mistakes. Each person in the chat acted reasonably on the information and tools they had. Asking "who should have caught this" would stop us looking for the reason no step in the process caught it.

1. **`POST /wrench` is not idempotent.** The endpoint has no duplicate check and no idempotency key, so a retried request is treated as a new report. Before this feature, a duplicate report was cheap. `wrench_disables_bike` made every duplicate also disable the bike and add a crew job.
2. **Client retries and server behaviour were never designed together.** The rider app retries a failed wrench up to 3 times when the network drops. That is reasonable client behaviour, but nothing on the server side expected it. `work/spec.md`, `work/plan.md`, the code in `src/` and the tests in `test/` do not mention retries, duplicates or idempotency.
3. **Retries were not tested.** As Raj Patel said at 09:02, the test suite never sends the same wrench twice, and there is no test with a flaky network. The tests and the review passed because they never ran the failing case.
4. **The rollback guardrail did not act on its own.** `work/rollout.yaml` says to run `bun run rollback` when availability is under 96 for 10 minutes. That condition was true at 08:10, but the flag stayed on until 09:30. The alert reached a person, but nothing rolled back automatically, and the runbook did not tell on-call to roll back before finding the cause. This gap cost about 80 minutes at reduced availability.
5. **The alert and the acknowledgement were slow.** The alert fired 25 minutes after the storm began and was acknowledged 15 minutes later. Availability had fallen gradually and crossed 96 percent only after 20 minutes.
6. **Recovering the bikes was manual.** Turning the flag off stopped new damage but did not re-enable bikes that were already disabled. A script had to be written during the incident, which added 80 minutes to the recovery.

## What went well

- The district-by-district rollout worked. Only North was affected.
- The feature flag let the team stop the damage in one step, without a redeploy.
- The availability alert fired on the same threshold as the contract guardrail.
- The team diagnosed the cause quickly from the evidence: the queue size (08:34), then the repeated bike ids (08:47), then the client's retry behaviour (09:02), then the cause (09:05).
- The team re-enabled only the 212 bikes whose jobs were all duplicates, so bikes that really needed repair stayed out of service.
- People with different roles shared what they knew in the incident channel as soon as they found it.

## Action items

Owners are listed by role. The team should assign named owners and due dates in review. These are system changes. They do not ask anyone to be more careful.

| #   | Action                                                                                                                                                                                                                 | Type      | Owner (role)               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------- |
| A1  | Make `POST /wrench` idempotent. The app sends an idempotency key, and the server returns the existing job for a repeated key or a repeated (bike, reporter, short window). Keep the flag off in North until this ships | Prevent   | spoke engineering          |
| A2  | Add acceptance tests for a retried wrench, including 3 identical requests a few seconds apart. Expect one job and one disable. This needs QA approval because it is a new file in `test/acceptance/`                   | Detect    | QA + spoke engineering     |
| A3  | Add "client retries and duplicate requests" to the spec and review checklists for any endpoint that changes state                                                                                                      | Prevent   | tech lead                  |
| A4  | Wire the `rollout.yaml` guardrails to run `bun run rollback` (or turn off the flag) on their own after 10 minutes. Until then, put "turn off the flag first, then diagnose" first in the on-call runbook               | Mitigate  | release manager + platform |
| A5  | Add an alert on crew queue size or on duplicate jobs per bike. Either would have flagged this before availability crossed 96                                                                                           | Detect    | spoke engineering          |
| A6  | Turn the 10:18 re-enable script into a tested, reviewed tool in the runbook                                                                                                                                            | Recover   | spoke engineering          |
| A7  | Agree with Brannock City Transport how the duplicate jobs count toward the 48-hour repair clock and the availability SLA for 2026-11-03                                                                                | Follow-up | account / contract owner   |
| A8  | Look into the 15 minutes from alert to acknowledgement (paging route and escalation)                                                                                                                                   | Detect    | on-call lead               |
