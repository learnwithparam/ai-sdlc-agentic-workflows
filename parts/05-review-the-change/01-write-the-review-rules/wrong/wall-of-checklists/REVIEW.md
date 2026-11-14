# REVIEW.md

How to review a change to `spoke`. Read `AGENTS.md` and `data/contract/sla.yaml` first. This
guide applies them to a diff. It does not replace them.

`spoke` feeds the city's public data and the repair crews. If it is wrong, riders rent broken
bikes and Kestrel pays the city credits. So review against the contract first and style last.

## 1. Blockers: reject the change if any of these hold

- **The diff touches `data/contract/sla.yaml`.** Only the city edits it. If the change only
  works with a different SLA, it is a contract conflict. Send it to the product manager. Do not
  merge it.
- **The diff runs, schedules or automates `bun run deploy:production` or `bun run rollback`**
  without a named person's approval. That includes CI steps, hooks and scripts.
- **It adds a dependency.** `package.json` must not gain `dependencies` or `devDependencies`.
  Only Bun built-ins (`bun:sqlite`, `Bun.serve`, `bun:test`, `node:*`).
- **It conflicts with the contract** (see section 2), even when a ticket asks for it. Example:
  the 15-minute "grace period" before a wrenched bike leaves the feed (spec C-1) breaks SLA-12
  and was deliberately not built. If a change brings it back in any form (delay, batching,
  cache, "soft" disable), it is a blocker.

## 2. Contract checks, by area

Ask these whenever a diff touches `src/wrenches.ts`, `src/feed.ts`, `src/crew-queue.ts`,
`src/map-page.ts`, `src/database.ts` or the seed CSVs.

### Wrench reports (`POST /wrench`, `src/wrenches.ts`)

- The `wrenches` insert, the `repair_jobs` insert (`source='wrench'`) and
  `UPDATE bikes SET is_disabled = 1` all happen **inside one `database.transaction`**. A new
  write that belongs with them goes inside too.
- `logEvent` is called **after** the commit, never inside the transaction. A failed log must
  not roll back a wrench, and a rolled-back wrench must not be logged.
- Unknown bikes still get **404 before any write**. Look for new code that writes before the
  lookup.
- Job ids still come from the wrench row id (`J-W-<wrench_id>`). Do not accept `Date.now()`
  or random ids. Two wrenches in the same millisecond used to collide on the primary key.
- `reported_at` is the moment the rider reported, taken on the server. Nothing may move it
  later.
- A second wrench on an already-disabled bike must not re-enable it or change other bikes
  (AC-6, AC-13).

### Public feed (`src/feed.ts`, SLA-12)

- `ttl` stays at **60 seconds or less**. `last_updated` is the time of the response.
- Available and disabled counts come from `bikes.is_disabled` and nothing else. A wrenched bike
  must show `is_disabled: true` in `vehicle_status.json` and count as disabled in
  `station_status.json` at once.
- **No caching, memoising or background refresh** that could serve older counts. "Feed served
  stale station counts" has happened twice (INC-04, INC-07).
- `num_docks_available` must not count docks that hold bikes, disabled ones included.
  "Docks shown free while full" happened in INC-09.
- Removing or renaming a field is a breaking change for rider apps and the city. Keep the
  GBFS v3 shape. "E-bike battery levels missing from feed" has happened three times
  (INC-02, INC-05, INC-06).
- `src/map-page.ts` must take its counts from `stationStatus`, not its own query, so the map
  always matches the feed (AC-5).

### Crew queue (`src/crew-queue.ts`, SLA-4)

- Deadline = `reported_at` + **48h for `source='wrench'`, 96h for anything else**. Never
  `opened_at`. Hours must not be hard-coded anywhere else in a way that can drift from
  `sla.yaml`.
- Order: deadline, then `reported_at`, then `job_id`. The sort must stay total and stable.
- `?depot=` filtering still works, and no depot means all depots (AC-11).
- Treat a lateness bug as a money bug. Each late wrenched bike costs £50. If a queue change
  could push a job later, ask for a test that shows it does not.
- Watch query cost. "Crew queue page timed out" has happened three times (INC-01, INC-03,
  INC-08). Watch for per-job queries in a loop, unindexed scans added to the hot path, or
  loading closed jobs.

### Schema and seed data (`src/database.ts`, `data/*.csv`)

- A change to `TABLES` or to `stations.csv`, `bikes.csv` or `open-jobs.csv` means `spoke.db`
  must be deleted and reseeded. The PR description should say so.
- Seed jobs stay relative to now (`*_hours_ago`), and their bikes stay `is_disabled = 1`
  (AC-10).
- `src/csv.ts` splits on commas. Reject any CSV value containing a comma or a quote, or
  replace the parser in the same PR.
- `wrenches.csv`, `repairs.csv`, `deploys.csv`, `incidents.csv` and `roster.csv` are for
  analysis only. Service code must not start reading them.

## 3. Tests

- Behaviour changes in the three areas above need a test in `test/acceptance/` (one file per
  AC) or `test/feed.test.ts`. A change that alters what an AC checks updates that AC's test
  in the same PR. It must not delete the test.
- Tests set `SPOKE_DB` and `SPOKE_LOG` to temp files **before** importing `src/database` or
  `src/log`. Use `test/acceptance/helpers.ts` or the dynamic `await import(...)` pattern. A
  static `import` from `src/` is hoisted above the env lines and writes to the real `spoke.db`.
- Tests call functions directly (`recordWrench`, `vehicleStatus`, `crewQueue`, ...). They
  never import `src/server.ts`, which starts `Bun.serve` on load.
- Tests must not depend on wall-clock luck. Compare deadlines against `reported_at`, not
  against `new Date()` with a tolerance.
- Run `bun test` locally. All tests pass, and none are skipped or `.only`.

## 4. Code and docs

- Keep the existing style: small modules, plain SQL with `?` parameters (never string-built
  SQL from request input), short comments that explain _why_, often naming the SLA.
- Validate request bodies at the edge (`src/server.ts`). A bad JSON body must give a 4xx, not
  an exception.
- If a change makes `CLAUDE.md`, `README.md` or a code comment wrong (routes, SLA references,
  "Things Claude gets wrong"), update it in the same PR.
- Keep PRs small and in one slice, like the `P-n` commits. Tests for a behaviour come before or
  with the `src/` change.

## 5. Reviewer checklist

```
[ ] data/contract/ untouched; no deploy/rollback run or automated; no new packages
[ ] Wrench writes in one transaction; log after commit; 404 before any write
[ ] Feed: ttl ≤ 60, no caching, counts from bikes.is_disabled, GBFS fields kept
[ ] Queue: deadline from reported_at (48h/96h); order deadline → reported_at → job_id
[ ] Map counts still come from stationStatus
[ ] Schema/seed change → spoke.db reseed noted
[ ] Tests added/updated; temp SPOKE_DB/SPOKE_LOG; bun test passes
[ ] Docs and comments still true
```

If a change asks for something the contract forbids, write down which SLA, what the request
asks for, and why they clash. Then escalate to the product manager. Do not approve it.
