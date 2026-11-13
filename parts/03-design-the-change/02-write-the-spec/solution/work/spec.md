# Spec: a wrench takes the bike out of service

Source: `work/intent.md` (approved). Contract: `data/contract/sla.yaml` (read-only, owned by
Brannock City Transport). This page says what must be true when the work is done. It does not
say how to build it.

## Product manager answers (interview)

| Question                                             | Answer                                                     | What this spec does with it                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Grace period before a wrenched bike leaves the feed? | Operations wants 15 minutes, to stop false reports.        | **Not built.** It conflicts with SLA-12. See Concerns C-1. The spec disables the bike at once. |
| Do station counts change too?                        | Yes. `station_status.json` must change, not only the bike. | AC-3, AC-4, AC-5.                                                                              |
| Queue order?                                         | The job due first goes on top.                             | AC-8, AC-9.                                                                                    |
| Jobs already open at launch?                         | Their deadlines follow the contract from launch.           | AC-10.                                                                                         |

## Contract rules that apply

- **SLA-4:** the clock starts at the rider's report (`reported_at`). Limit is 48h for a wrench
  (`source = 'wrench'`) and 96h for a defect a crew finds itself (any other `source`, e.g.
  `inspection`, where `reported_at` is when the crew found it). Target 95% on time, £50 credit
  per late bike.
- **SLA-9:** at least 96% of the fleet rentable.
- **SLA-12:** the public feed is accurate at all times and no more than 60 seconds old.

## Scope

In scope:

- `POST /wrench` disables the bike.
- `/gbfs/v3/vehicle_status.json` and `/gbfs/v3/station_status.json` reflect that, and so does the
  station map at `/` (it reuses `stationStatus`).
- `/crew/queue` deadlines and order count from `reported_at`.

Out of scope:

- Closing a repair job and putting the bike back in service. No route for this exists today; the
  bike stays disabled until a later change adds one (see C-3).
- Changes to the feed `ttl` (stays 60), to `data/contract/sla.yaml`, or to the historical
  `data/*.csv` files.
- The North e-bike battery issue in `work/findings.md`.

## Acceptance criteria

### Wrench disables the bike

**AC-1. A wrench disables the bike in the vehicle feed at once**

- WHEN a rider sends `POST /wrench` for a bike whose `bikes.is_disabled` is 0 and the response
  status is 201
- THEN the next `GET /gbfs/v3/vehicle_status.json` shows that bike's `vehicle_id` with
  `is_disabled: true`, with no wait (0 seconds of grace, well inside the 60 second SLA-12 limit),
  and `bikes.is_disabled` for that bike is 1.

**AC-2. The wrench, the repair job and the disabled flag are recorded together**

- WHEN `POST /wrench` returns 201
- THEN exactly 1 new `wrenches` row and 1 new `repair_jobs` row (`source = 'wrench'`,
  `closed_at` NULL) exist for the bike, and `bikes.is_disabled` is 1. If any of the three writes
  fails, none of them is kept.

**AC-3. Station available count drops by one**

- WHEN `POST /wrench` returns 201 for a bike at station S that was not disabled
- THEN in the next `GET /gbfs/v3/station_status.json`, station S's `num_vehicles_available` is 1
  lower than before the wrench.

**AC-4. Station disabled count rises by one**

- WHEN `POST /wrench` returns 201 for a bike at station S that was not disabled
- THEN in the next `GET /gbfs/v3/station_status.json`, station S's `num_vehicles_disabled` is 1
  higher than before the wrench, and `num_docks_available` is unchanged.

**AC-5. The map shows the same counts as the feed**

- WHEN `POST /wrench` returns 201 for a bike at station S
- THEN the station map at `/` shows station S with the same `num_vehicles_available` and
  `num_vehicles_disabled` values as `station_status.json` at that moment.

**AC-6. A second wrench on an already disabled bike changes no counts**

- WHEN `POST /wrench` is sent for a bike whose `bikes.is_disabled` is already 1
- THEN the response status is 201, a new `wrenches` row is recorded, the bike's `is_disabled`
  stays `true`, and station S's `num_vehicles_available` and `num_vehicles_disabled` are
  unchanged (change of 0).

**AC-7. Unknown bikes change nothing**

- WHEN `POST /wrench` is sent with a `bike_id` that is not in `bikes`
- THEN the response status is 404, 0 rows are added to `wrenches` and `repair_jobs`, and no
  station count in `station_status.json` changes.

### Crew queue follows SLA-4

**AC-8. Deadlines count from the rider's report**

- WHEN `GET /crew/queue` returns an open job
- THEN its `deadline` equals `reported_at` + 48 hours if `source` is `wrench`, and `reported_at`
  - 96 hours for any other `source`. `opened_at` is not used.

**AC-9. The job due first is on top**

- WHEN `GET /crew/queue` (with or without `depot`) returns 2 or more open jobs
- THEN the `jobs` array is sorted by `deadline` ascending, so `jobs[0]` has the earliest
  `deadline`. Jobs with equal `deadline` are ordered by `reported_at` ascending, then `job_id`.

**AC-10. Jobs already open at launch follow the contract**

- WHEN `GET /crew/queue` is called after the change ships, for a job opened before it shipped
- THEN that job's `deadline` is also `reported_at` + 48h (`wrench`) or + 96h (other), and its
  place in the order follows AC-9. With the seed data in `data/open-jobs.csv` (40 jobs), each
  `deadline` moves earlier by the job's `opened_at` − `reported_at` gap (0.1h to 1.0h), and 0 jobs
  become overdue at launch.

**AC-11. Depot filter still works**

- WHEN `GET /crew/queue?depot=North` is called
- THEN every job in `jobs` has `depot` `North`, and the order and `deadline` rules of AC-8 and
  AC-9 hold.

### No regressions

**AC-12. Feed freshness is unchanged**

- WHEN either GBFS feed is requested
- THEN the response has `ttl` 60, `version` `"3.0"`, and a `last_updated` no older than 60
  seconds.

**AC-13. Bikes with no wrench are untouched**

- WHEN `POST /wrench` returns 201 for one bike
- THEN every other bike's `is_disabled` value in `vehicle_status.json` is unchanged (0 other
  bikes change).

## Test notes

- Set `SPOKE_DB` and `SPOKE_LOG` to temp files before importing `src/database` (AGENTS.md).
- AC-1 has no test today (CLAUDE.md). Each AC above needs at least one test.
- No new packages.

## Concerns

**C-1. The 15 minute grace period breaks SLA-12. Not built.**

- Contract clause: SLA-12, "Real-time data in the public feed is accurate and available to the
  public at all times", `feed_max_age_seconds: 60`.
- What was asked: Operations wants a wrenched bike to stay in the feed as rentable for 15
  minutes (900 seconds) after the wrench, to filter false reports.
- Why they clash: for those 900 seconds the feed would show a reported bike as available, which
  is inaccurate and 15× the 60 second limit. Riders could rent a bike another rider has reported
  broken, the exact safety problem the intent sets out to fix (193 re-rents, 8.9%).
- Decision owner: **Brannock City Transport** owns the contract. Only the city can allow a grace
  period, by changing `sla.yaml`. The **product manager** decides whether to drop the request or
  take it to the city. Until then this spec disables the bike at once (AC-1).
- Better ways to handle false reports, for the product manager to consider: let a crew clear a
  false report quickly (C-3), or flag repeat reporters. These keep the feed accurate.

**C-2. Fleet availability will drop. Risk to SLA-9, not a conflict yet.**

- Contract clause: SLA-9, `minimum_percent: 96`.
- What happens: every wrenched bike now counts as not rentable until its job closes. The 40
  seed open jobs already disable 40 of 2,100 bikes (1.9%). More wrenches, and slower repairs at
  North, push this up.
- Decision owner: **Operations** owns repair capacity and should check headroom to 96% per
  district before launch. This spec cannot meet SLA-9 by keeping broken bikes rentable; that
  would break SLA-12.

**C-3. No way to put a bike back in service.**

- Contract clauses: SLA-9 (bikes held out longer than needed) and SLA-4 (jobs must close within
  48h / 96h).
- What happens: the intent says the bike stays disabled until a crew closes the job, but `spoke`
  has no route to close a job or clear a false report. After this change, disabled bikes only
  come back if someone edits the database.
- Decision owner: **product manager**, to scope a follow-up "close job / clear false report"
  change. Without it, C-2 gets worse over time.

**C-4. Crews and feed users need notice.**

- Contract clauses: SLA-4 (queue deadlines move earlier) and SLA-12 (disabled counts in the
  public feed rise).
- What happens: deadlines on open jobs move earlier by up to 1.0h at launch, and the queue order
  changes. The city and third-party apps will see `num_vehicles_disabled` go up.
- Decision owner: **product manager** with **Operations** (crew briefing for North and South
  depots) and the **Brannock City Transport** contact (feed users).
