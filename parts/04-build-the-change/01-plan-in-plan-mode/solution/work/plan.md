# Plan: a wrench takes the bike out of service

Spec: `work/spec.md` (AC-1 to AC-13). Decision: `work/decisions/0001-disable-in-feed.md` (keep the
bike in `vehicle_status.json` with `is_disabled: true`). Contract: `data/contract/sla.yaml`, read
only. Nothing in this plan touches `data/contract/`. C-1 (15 minute grace period) is not built.

What is wrong today:

- `src/wrenches.ts` `recordWrench` never sets `bikes.is_disabled`, so a wrenched bike still looks
  rentable (SLA-12). Its three writes are not in a transaction. Its job id `J-${Date.now()}` clashes
  on the `repair_jobs` primary key if two wrenches arrive in the same millisecond.
- `src/crew-queue.ts` counts deadlines from `opened_at` and sorts by `opened_at` (SLA-4 says
  `reported_at`, and the PM wants the job due first on top).
- `src/map-page.ts` shows only a per-station disabled badge, so AC-5 can't check a station's
  available count on the map.

## Files that change

| File                                                                                        | Item | Change                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/acceptance/helpers.ts`                                                                | P-1  | New. Sets `SPOKE_DB`/`SPOKE_LOG` to temp files _before_ it imports `src/database`. Exports `openDatabase`, `stationOf(db, bikeId)`, `countRows(db, table, bikeId)`, `stationCounts(db, stationId)` (reads `stationStatus`). Not a test file. |
| `test/acceptance/ac-1-wrench-disables-bike.test.ts` … `ac-13-other-bikes-untouched.test.ts` | P-1  | New. 13 files, one per AC (names below).                                                                                                                                                                                                     |
| `src/wrenches.ts`                                                                           | P-2  | One transaction: insert wrench, insert job, `UPDATE bikes SET is_disabled = 1`. Job id from the wrench row id. Log after commit. About 25 lines.                                                                                             |
| `src/crew-queue.ts`                                                                         | P-3  | Deadline from `reported_at`. Sort by deadline, then `reported_at`, then `job_id`. Fix the comments. About 15 lines.                                                                                                                          |
| `src/map-page.ts`                                                                           | P-4  | Station `<title>` shows the station's `num_vehicles_available` and `num_vehicles_disabled` from `stationStatus`. About 10 lines.                                                                                                             |
| `CLAUDE.md`                                                                                 | P-5  | Remove the two "Things Claude gets wrong" bullets that are now fixed. Update the `wrenches.ts`/`crew-queue.ts` lines. About 10 lines.                                                                                                        |

Not changed: `data/contract/sla.yaml`, `data/*.csv`, `src/feed.ts` (`ttl` stays 60), the schema
(so `spoke.db` doesn't need deleting), `package.json` (no new packages).

## Order of work

### P-1. Acceptance tests only (serves AC-1 to AC-13)

One commit with only `test/acceptance/`, made before any change to `src/`. The tests call the
functions directly (`recordWrench`, `vehicleStatus`, `stationStatus`, `mapPage`, `crewQueue`), the
same way `test/feed.test.ts` does. That way no test imports `src/server.ts`, which starts
`Bun.serve` as soon as it loads. A 201/404 here means `recordWrench(...).status`.

Each file wrenches its own fixed bike id, one that is not in `open-jobs.csv`, and checks
before/after _differences_, not totals. That keeps the files independent even if Bun shares one
module cache (and so one DB file) across test files (see Risks).

| File                             | What it checks                                                                                                                                                                                                                                                                                                                               | Today                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `ac-1-wrench-disables-bike`      | 201, then the bike's `vehicle_status` entry has `is_disabled: true` and `bikes.is_disabled = 1`                                                                                                                                                                                                                                              | **fails**                                                               |
| `ac-2-wrench-records-atomically` | (a) After a 201: +1 `wrenches` row, +1 `repair_jobs` row (`source='wrench'`, `closed_at` NULL), `is_disabled = 1`. (b) Add a TEMP trigger that raises on `UPDATE bikes`, then call `recordWrench`. It must throw, and 0 new wrench or job rows are kept. (c) Same with a trigger on `INSERT INTO repair_jobs`. Drop the triggers afterwards. | **fails** (a, b, c)                                                     |
| `ac-3-station-available-drops`   | Station S `num_vehicles_available` is 1 lower                                                                                                                                                                                                                                                                                                | **fails**                                                               |
| `ac-4-station-disabled-rises`    | S `num_vehicles_disabled` is 1 higher, `num_docks_available` unchanged                                                                                                                                                                                                                                                                       | **fails**                                                               |
| `ac-5-map-matches-feed`          | After a wrench, the station S `<title>` in `mapPage` shows the same available/disabled numbers as `stationStatus`. The red badge also equals the new disabled count.                                                                                                                                                                         | **fails** (map has no available count; badge doesn't move)              |
| `ac-6-second-wrench-no-change`   | (a) A seed-disabled bike: 201, +1 wrench row, counts change by 0. (b) Wrench a fresh bike twice in a row: the second call is 201, +1 wrench row, `is_disabled` still true, S counts change by 0 between the first and second wrench.                                                                                                         | (a) passes, (b) **fails** (not disabled; same-millisecond job id clash) |
| `ac-7-unknown-bike-404`          | `B-NOPE`: 404, 0 new wrench or job rows, all station counts the same                                                                                                                                                                                                                                                                         | passes (guard)                                                          |
| `ac-8-deadline-from-report`      | Every queue job: `deadline == reported_at + 48h` (wrench) or `+ 96h` (other). Includes a job with a 1h gap between report and opening.                                                                                                                                                                                                       | **fails**                                                               |
| `ac-9-due-first-on-top`          | `jobs` sorted by `deadline` asc, then `reported_at`, then `job_id`, with and without `depot`. Also inserts two jobs with an equal deadline to check the tie-break.                                                                                                                                                                           | **fails**                                                               |
| `ac-10-open-jobs-at-launch`      | For the 40 `J-OPEN-*` seed jobs: deadline from `reported_at`. The deadline is earlier than `opened_at + limit` by the CSV gap (0.1h to 1.0h, ±1s). 0 have `deadline < now`. Order follows AC-9.                                                                                                                                              | **fails**                                                               |
| `ac-11-depot-filter`             | `depot=North`: every job is North, and the AC-8 and AC-9 rules hold                                                                                                                                                                                                                                                                          | **fails**                                                               |
| `ac-12-feed-freshness`           | Both feeds: `ttl` 60, `version` "3.0", `last_updated` no more than 60s old                                                                                                                                                                                                                                                                   | passes (guard)                                                          |
| `ac-13-other-bikes-untouched`    | Snapshot every `is_disabled`, wrench one bike, exactly 0 other bikes change                                                                                                                                                                                                                                                                  | passes (guard)                                                          |

The four guards protect behaviour that is right today and must stay right. Every other file fails
today, for the reason in the spec.

### P-2. Wrench disables the bike, atomically (serves AC-1, AC-2, AC-3, AC-4, AC-6, AC-7, AC-13; keeps AC-12 green)

`src/wrenches.ts`:

- Keep the 404 lookup before any write (AC-7).
- Wrap the wrench insert, the job insert and `UPDATE bikes SET is_disabled = 1 WHERE bike_id = ?`
  in `database.transaction(...)` (bun:sqlite). Any throw rolls back all three (AC-2).
- Job id `J-W-${wrenchId}`, where `wrenchId` is the wrench insert's `lastInsertRowid`. It's unique,
  so two wrenches in the same millisecond no longer clash (AC-6b).
- Call `logEvent` only after the commit.
- `src/feed.ts` already reads `is_disabled`, so AC-3 and AC-4 follow without changing the feed.

### P-3. Crew queue follows SLA-4 (serves AC-8, AC-9, AC-10, AC-11)

`src/crew-queue.ts`: `contractDeadline` uses `reported_at`. Build the deadline first, then sort by
`deadline`, then `reported_at`, then `job_id` (ISO strings sort correctly with `localeCompare`).
Replace the "dispatch desk opened the job" and "oldest job first" comments. The depot SQL filter
doesn't change. AC-10 needs no migration because the deadline is worked out on every request.

### P-4. Map shows the station counts (serves AC-5)

`src/map-page.ts`: pass the station's `stationStatus` entry to `stationDot`. The title becomes
`S-001 Weaver Road: 7 available, 1 disabled`. The badge stays as it is. The numbers still come
only from `stationStatus`, so the map can't drift from the feed.

### P-5. Docs (no AC; keeps CLAUDE.md accurate)

Remove the now-fixed bullets about `opened_at` and the wrench not disabling the bike. Keep the
`sla.yaml` bullet.

Each of P-2 to P-5 is its own commit and stays well under 200 changed lines. After each commit,
`bun test` shows only the remaining expected failures.

## Risks

- **Riskiest: P-2** (the only write path, and the one riders and the city see). It could break:
  - **The 404 path** if the lookup ends up inside or after the transaction. AC-7 guards this.
  - **The job id format** changes from `J-<ms>` to `J-W-<n>`. The `POST /wrench` response and the
    `spoke.log` lines carry it. Nothing in `src/` parses it, but log readers or dashboards might.
    Flag it to the PM.
  - **SLA-9 headroom** (C-2): the number of disabled bikes in the feed now rises with every wrench,
    and nothing re-enables a bike (C-3). This is correct behaviour, but Operations must check
    headroom to 96% before launch. Feed users need notice (C-4).
  - **Partial writes** if the transaction is done wrong. AC-2 (b) and (c) force failures to prove
    the rollback.
- **P-3** changes the order crews see and moves open deadlines up to 1.0h earlier (C-4). The code
  risk is low; the people risk is that crews need a briefing before release.
- **Test isolation:** `src/database.ts` reads `SPOKE_DB` once, when it loads. If `bun test` shares
  the module cache across files, every file uses the first file's DB. To cope, the tests use
  differences, a different bike per file, and filter on `J-OPEN-*` for AC-10. Each file is also
  run on its own (see Proof).
- **AC-5 interpretation:** the spec asks for the map to show `num_vehicles_available` per station.
  Today the map doesn't, so P-4 adds it to the title. That is a small visible UI change.

## Proof

| Item | Proof                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-1  | `git show --stat HEAD` lists only `test/acceptance/*`. `bun test test/acceptance` fails AC-1, 2, 3, 4, 5, 6, 8, 9, 10, 11, and passes AC-7, 12, 13. Record the output in the commit message. `bun test test/feed.test.ts` still passes.                                                                                                                                                                                                                                                                                                                                                                  |
| P-2  | `bun test test/acceptance/ac-1* ac-2* ac-3* ac-4* ac-6* ac-7* ac-12* ac-13*` pass. AC-5 and AC-8 to AC-11 still fail. `bun test test/feed.test.ts` passes. `git diff --stat HEAD~1` is under 200 lines and touches only `src/wrenches.ts`.                                                                                                                                                                                                                                                                                                                                                               |
| P-3  | `bun test test/acceptance/ac-8* ac-9* ac-10* ac-11*` pass, and the P-2 set still passes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| P-4  | `bun test test/acceptance/ac-5*` passes. Full `bun test` is green.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| P-5  | `bun test` is still green. CLAUDE.md no longer describes the old bugs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| All  | Run each acceptance file on its own (`for f in test/acceptance/*.test.ts; do bun test "$f"; done`) and all together (`bun test`). Then a manual check: `SPOKE_DB=/tmp/spoke-e2e.db SPOKE_LOG=/tmp/spoke-e2e.log PORT=4199 bun run world`. `curl -XPOST localhost:4199/wrench -d '{"bike_id":"<id>","fault":"BRAKE"}'` gives 201. That bike shows `is_disabled: true` in `/gbfs/v3/vehicle_status.json`, and its station's counts in `station_status.json` move by ∓1. `/crew/queue?depot=North` is sorted by deadline. `git diff --stat <base> -- data/contract` is empty. No deploy or rollback is run. |
