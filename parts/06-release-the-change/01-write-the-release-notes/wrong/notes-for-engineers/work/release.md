# Release notes: a wrench takes the bike out of service

Commits on `main`: `c0913af` (P-1 tests) and `d838216`..`53ba65d` (P-2 to P-5).
Spec: `work/spec.md` (AC-1 to AC-13). Plan: `work/plan.md`. Decision: `work/decisions/0001-disable-in-feed.md`.
Contract: `data/contract/sla.yaml`, unchanged.

**Not yet deployed.** `bun run deploy:production` needs a person's approval (AGENTS.md).

## What changes

### Riders and feed users

- **A wrenched bike can no longer be rented.** As soon as `POST /wrench` returns 201, the bike
  shows `is_disabled: true` in `/gbfs/v3/vehicle_status.json`. There is no grace period (SLA-12).
  Before this release a reported bike stayed rentable, and 193 bikes (8.9% of wrenches) were rented again.
- **Station counts move with it.** In `/gbfs/v3/station_status.json` the bike's station shows
  `num_vehicles_available` 1 lower and `num_vehicles_disabled` 1 higher. `num_docks_available`
  does not change. A second wrench on a bike that is already disabled changes no counts.
- The bike stays in `vehicle_status.json`, flagged as disabled. It is not dropped from the feed (decision 0001).
- Feed `ttl` (60), `version` (`"3.0"`) and freshness do not change.

### Crews (`/crew/queue`)

- **Deadlines start at the rider's report** (`reported_at`), not when the job was opened (SLA-4):
  48h for a wrench, 96h for a defect a crew found itself.
- **The job due first is on top.** Jobs are sorted by deadline, then `reported_at`, then `job_id`.
  Before, the oldest opened job came first.
- Jobs that are already open get the new deadlines straight away, with no migration. For the
  40 seed open jobs, each deadline moves 0.1h to 1.0h earlier. None become overdue at launch.
- `?depot=` filtering does not change.

### Station map (`/`)

- Each station's hover title now shows its counts, for example
  `S-001 Weaver Road: 7 available, 1 disabled`. The numbers come from `station_status.json`, so
  the map always matches the feed. The red badge now goes up when a bike is wrenched.

## Technical notes

- `src/wrenches.ts`: the wrench row, the repair job and `bikes.is_disabled = 1` are written in a
  single transaction. If one write fails, none are kept. The log line is written after the commit.
  Unknown bikes still get 404 before anything is written.
- **Job id format change:** wrench jobs are now `J-W-<wrench id>` (were `J-<ms timestamp>`).
  This fixes a primary-key clash when two wrenches arrive in the same millisecond. Nothing in
  `src/` parses the id, but the `POST /wrench` response and `logs/spoke.log` carry it, so any
  log reader or dashboard that matches `J-<digits>` must be updated.
- `src/crew-queue.ts`: deadline from `reported_at`, new sort order.
- `src/map-page.ts`: station title shows available and disabled counts.
- No schema change, so `spoke.db` does not need deleting. No new packages. `src/feed.ts` is unchanged.

## Tests

- New: `test/acceptance/`, one file per AC (AC-1 to AC-13), approved by QA (Raj Patel).
  Written and committed before any `src/` change (P-1).
- The P-4 commit records the full `bun test` as green: 28 pass, 0 fail. I did not run it again
  while writing these notes.

## Before release: open items

| #   | Item                                                                                                                                                                        | Owner                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| C-1 | The 15 minute grace period Operations asked for is **not built**. It conflicts with SLA-12. Only the city can allow it. The PM decides whether to drop it or take it to the city. | PM / Brannock City Transport   |
| C-2 | Fleet availability drops as wrenched bikes are disabled. The 40 seed jobs already take 1.9% of bikes out of service. Check how close each district (North especially) is to the SLA-9 minimum of 96%. | Operations                     |
| C-3 | **No way to put a bike back in service yet.** No route closes a job or clears a false report, so a disabled bike stays disabled unless someone edits the DB. Needs a follow-up change. | PM                             |
| C-4 | Brief North and South crews on the new queue order and earlier deadlines. Tell the city and third-party feed users that disabled counts will go up.                         | PM, Operations, city contact   |
| —   | Tell log and dashboard owners about the `J-W-<n>` job id format.                                                                                                           | Tech lead                      |
| —   | Decision 0001 still says `Status: proposed`, but the tech lead has approved it in `work/approvals.jsonl`. Set it to accepted.                                              | Tech lead                      |

## Not in this release

- The North e-bike battery issue (`work/findings.md`).
- The teammate branches (`teammate/local-deadlines`, `deadline-labels`, `queue-search`).
  `work/review.md` reviews `local-deadlines` separately. None of them are merged here.
- No changes to `data/contract/sla.yaml` or the historical `data/*.csv` files.
