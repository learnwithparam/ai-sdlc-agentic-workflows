# CLAUDE.md

@AGENTS.md

`spoke` is the Kestrel Bike Share service for Brannock (180 stations, 2,100 bikes): public GBFS v3 feed, rider wrench reports (`POST /wrench`), and the crew repair queue. Bun + TypeScript, no dependencies, no build step, no linter.

## Commands

| Command                                          | What it does                                             |
| ------------------------------------------------ | -------------------------------------------------------- |
| `bun run world`                                  | Start spoke on http://localhost:4100 (`PORT` overrides)  |
| `bun test`                                       | Run all tests                                            |
| `bun test test/feed.test.ts`                     | Run one test file                                        |
| `bun test -t "station feed"`                     | Run tests matching a name                                |
| `bun run deploy:production` / `bun run rollback` | Deploy / roll back (needs human approval, see AGENTS.md) |

## Conventions

- `SPOKE_DB` and `SPOKE_LOG` override the DB and log paths.
- `src/csv.ts` is a naive comma split; it works only because no data field contains a comma.
- `src/log.ts` appends JSON lines to `logs/spoke.log`.
- Extra `data/*.csv` files (`wrenches`, `repairs`, `deploys`, `incidents`, `roster`) are historical records for analysis. The service never reads them.

## Architecture

- `src/server.ts`: routes and one shared SQLite `Database`. Routes: `/` (SVG map), `/health`, `/gbfs/v3/vehicle_status.json`, `/gbfs/v3/station_status.json`, `POST /wrench`, `/crew/queue?depot=...`.
- `src/database.ts`: schema (`stations`, `bikes`, `wrenches`, `repair_jobs`). Seeds from `data/stations.csv`, `bikes.csv`, `open-jobs.csv` when `spoke.db` is missing; open jobs become timestamps relative to now and their bikes get `is_disabled = 1`.
- `src/feed.ts`: both GBFS responses (`ttl` 60s for SLA-12). Disabled/available counts come from `bikes.is_disabled`. `src/map-page.ts` reuses `stationStatus`, so feed changes show on the map.
- `src/wrenches.ts`: in one transaction, inserts a `wrenches` row, a `repair_jobs` row (`source='wrench'`, id `J-W-<wrench id>`) and sets `bikes.is_disabled = 1`; logs after the commit. Unknown bikes get 404 before any write. An optional `request_id` (UNIQUE on `wrenches`) makes retries idempotent: a repeat returns 200 with the existing `job_id` and writes nothing; reusing it for another bike gets 409. Reports without a `request_id` still create a new wrench and job each time (AC-6).
- `src/crew-queue.ts`: open jobs, each with a contract `deadline` from `reported_at` (SLA-4: 48h wrench, 96h crew-found), sorted by deadline, then `reported_at`, then `job_id`.

## Things Claude gets wrong

- Check `data/contract/sla.yaml` before changing anything that touches wrenches, the feed, or the queue.
- Assume every write endpoint gets retried. The rider app resends a failed `POST /wrench` up to 3 times, and a request that failed on the client may already be committed on the server. In the North double wrench (2026-11-03, `work/postmortem.md`), retries without a duplicate check opened ~600 jobs and took 212 bikes out of service. Every new write must be idempotent and must have a test that sends the same request more than once (see `test/regression/a-1-wrench-retry.test.ts`).
- Never reset `reported_at` when you handle a duplicate. The SLA-4 clock starts at the first wrench, so a retry must return the existing job unchanged.
- A flag that makes a write disable bikes turns a duplicate into lost availability (SLA-9) and a wrong feed (SLA-12). For any such change, check retries, how the effect is undone, and whether the crew queue can blow up, not just the happy path.
