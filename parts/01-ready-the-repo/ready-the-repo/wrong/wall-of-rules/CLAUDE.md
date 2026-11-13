# CLAUDE.md — Kestrel `spoke` service

`spoke` runs the bike share for Brannock: 180 stations and 2,100 bikes. It serves the public GBFS feed, takes wrench reports from the rider app (`POST /wrench`), and lists repair jobs for crews (`GET /crew/queue`). Runtime is **Bun** (TypeScript, `bun:sqlite`, `Bun.serve`). It has no other dependencies and no `node_modules`.

## Hard rules (never break these)

1. **Never edit `data/contract/sla.yaml`.** Only the city changes it. It is the source of truth for what "correct" means. When code disagrees with it, the code is wrong.
2. **Never run `bun run deploy:production` or `bun run rollback`** unless a person has explicitly approved that specific release in this conversation. In the course world they only append a line to `logs/deploys.log`, but the team treats them as real. Release approval belongs to the release manager (see `data/roster.csv`).
3. **Don't commit `spoke.db` or `logs/`.** Both are gitignored and generated.
4. **Don't edit the historical data** in `data/*.csv` (`deploys`, `incidents`, `repairs`, `wrenches`, `roster`) to make code or tests pass. It is a record of what happened.
5. **Don't weaken or delete existing tests.** If a test seems wrong, say so and don't change it.

## Commands

| Command                     | What it does                                                  |
| --------------------------- | ------------------------------------------------------------- |
| `bun run world`             | Starts spoke on http://localhost:4100 (`PORT` overrides this) |
| `bun test`                  | Runs `test/*.test.ts` with `bun:test`                         |
| `bun run deploy:production` | ⚠️ Needs human approval. Writes to `logs/deploys.log`         |
| `bun run rollback`          | ⚠️ Needs human approval. Writes to `logs/deploys.log`         |

There is no build step, linter, formatter config or `tsconfig.json`. Match the existing style instead (see Code style below).

## Environment variables

- `PORT`: the server port. Default `4100`.
- `SPOKE_DB`: path to the SQLite file. Default `<repo>/spoke.db`.
- `SPOKE_LOG`: path to the event log. Default `<repo>/logs/spoke.log`.

## Layout

- `src/server.ts`: `Bun.serve` routes. Opens the database **once at module load**.
  - `GET /`: HTML/SVG station map (`src/map-page.ts`)
  - `GET /health`: returns `{ ok: true }`
  - `GET /gbfs/v3/vehicle_status.json` and `/gbfs/v3/station_status.json` (`src/feed.ts`)
  - `POST /wrench` (`src/wrenches.ts`): body `{ bike_id, fault? }`. Returns 201 `{ job_id, bike_id }`, or 404 if the bike is unknown. A bad JSON body is treated as `{}`.
  - `GET /crew/queue?depot=North` (`src/crew-queue.ts`): leave out `depot` to get all depots
  - Any other path returns 404 `{ error: "no such page" }`
- `src/database.ts`: schema and first-run seeding from CSVs.
- `src/csv.ts`: a naive CSV reader that splits on `,` with no quoting support.
- `src/log.ts`: appends JSON lines (`{ at, event, ...details }`) to the log file.
- `scripts/deploy.ts`: the deploy and rollback stub.
- `test/feed.test.ts`: the only tests, and they cover only the feed.

## Database gotchas

- **Seeding only happens when the DB file does not exist.** If you change `TABLES`, `stations.csv`, `bikes.csv` or `open-jobs.csv`, delete the local `spoke.db` (it's generated and gitignored) or the change won't show up. There are no migrations.
- Tables: `stations`, `bikes` (`is_disabled` is 0 or 1), `wrenches`, `repair_jobs` (`closed_at IS NULL` means open). `repair_jobs` inserts are **positional** (`VALUES (?, ?, …)`), so if you add a column, update every insert.
- `open-jobs.csv` stores times as _hours ago_ and turns them into absolute ISO times at seed time, so the queue looks fresh on every new DB. Seeding also sets those bikes to `is_disabled = 1` at the job's station.
- Only `stations.csv`, `bikes.csv` and `open-jobs.csv` are loaded into the DB. `wrenches.csv`, `repairs.csv`, `deploys.csv`, `incidents.csv` and `roster.csv` are historical and analysis data that the server never reads.
- All timestamps are ISO-8601 UTC strings, and the code compares them as strings with `localeCompare`. Keep them in that format.
- The CSV reader can't handle commas inside fields. Don't add any to the data files.
- Job IDs are `J-${Date.now()}`, so two wrenches in the same millisecond collide on the primary key.

## Testing gotchas

- Tests set `SPOKE_DB` and `SPOKE_LOG` to temp paths **before** importing `src/*` with a dynamic `await import(...)`. The DB path is read when the module loads, so a static import at the top would seed and write to the real `spoke.db` and `logs/`. Copy this pattern in any new test file.
- Don't import `src/server.ts` in tests. It opens the DB and starts listening on a port. Test the pure functions (`recordWrench`, `crewQueue`, `vehicleStatus`, …) against a temp DB.
- The fixture expects exactly 2,100 bikes and 180 stations.
- The existing tests pass even though there are known bugs (see below). A green run doesn't mean the behaviour matches the contract.

## The contract (`data/contract/sla.yaml`): what the code must honour

- **SLA-4 Bike defects:** a wrench press is notice of a defect. **The clock starts when the rider reports it (`reported_at`)**, not when dispatch opens the job. The limit is 48h when wrenched and 96h when not wrenched (`source = inspection`). Target: 95% on time. Each late bike costs £50 in credit.
- **SLA-9 Bike availability:** at least 96% of the fleet rentable, across every district.
- **SLA-11 Station outage:** no outage lasts longer than 4h.
- **SLA-12 Public feed accuracy:** real-time feed data is accurate and available at all times, and at most 60s old (`ttl: 60` in `feed.ts` matches this). The feed follows GBFS v3: https://github.com/MobilityData/gbfs/blob/master/gbfs.md

## Known contract violations in the current code

These are known gaps between the code and the SLA. Don't copy them into new code, and don't "fix" the SLA to match the code. Fix them only when asked, and flag them when you touch nearby code.

1. **Wrenched bikes stay rentable.** `recordWrench` (`src/wrenches.ts`) creates a job but never sets `bikes.is_disabled = 1`. The feed then shows a broken bike as available, which breaks SLA-12 and inflates SLA-9. The test file's header comment refers to this as "the wrench bug".
2. **Wrong deadline clock.** `contractDeadline` (`src/crew-queue.ts`) counts from `opened_at`. SLA-4 says to count from `reported_at`. The code comment there contradicts the contract.
3. **Queue order ignores deadlines.** The crew queue sorts by `opened_at` ("the way the dispatch desk has always worked") rather than by the deadline, so jobs close to breaching can sit behind older ones with more slack.
4. Nothing ever closes a job or re-enables a bike, because there is no endpoint for it.

## Past incidents (`data/incidents.csv`): areas to treat as high risk

These have caused production incidents before:

- crew queue page timed out (×3)
- e-bike battery levels missing from feed (×3)
- feed served stale station counts (×2)
- docks shown free while full (×1)

Changes to `feed.ts` or `crew-queue.ts` need tests. Keep `num_docks_available` clamped at ≥ 0 and the counts consistent with `vehicle_status`.

## Domain reference

- Districts (map colours in `map-page.ts`): North, East, Centre, South, West. Depots: **North** (North and East districts) and **South** (Centre, South and West). Crews: N1 and N2 (North), S1 and S2 (South).
- Fault codes: `BRAKE`, `TYRE`, `CHAIN`, `LOCK`, `BATT`, `OTHER` (used when the report has no fault).
- Job `source`: `wrench` (a rider reported it) or `inspection` (a crew found it).
- Repair outcomes in history: `fixed`, `part replaced`, `no fault found`.
- Bike types: `classic` and `ebike`. IDs look like `B-1000`, stations `S-001`, wrenches `W-00001`, jobs `J-00001` / `J-OPEN-01` / `J-<ms>`, deploys `D-001`, incidents `INC-01`.
- The map SVG is 940×660, and station `x`/`y` are coordinates inside it.

## Code style

- ES modules, TypeScript run directly by Bun. Use `bun:sqlite`, `bun:test`, `Bun.serve` and `node:` built-ins. Don't add npm dependencies without asking.
- Each file starts with a short plain-English comment that says what it does or which route it serves.
- Use descriptive full-word names (`database`, `station`, `first`/`second`), not abbreviations. Prefer small functions.
- Use parameterized SQL (`?` / `?1`) and never interpolate values into SQL strings.
- Name constants instead of using magic numbers (`HOUR`, `SECONDS_UNTIL_STALE`). Take contract numbers from the SLA and keep them in sync with it.
- Route handlers return JSON through `asJson(body, status)`.
- Log meaningful events with `logEvent(event, details)`.
