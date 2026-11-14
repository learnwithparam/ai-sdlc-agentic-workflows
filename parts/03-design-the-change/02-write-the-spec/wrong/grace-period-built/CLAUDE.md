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
- `src/wrenches.ts`: inserts a `wrenches` row and a `repair_jobs` row (`source='wrench'`), then logs.
- `src/crew-queue.ts`: open jobs, oldest first, each with a contract `deadline` (48h wrench, 96h crew-found).

## Things Claude gets wrong

- **The 48 hour clock starts at the wrench, not when the job is opened.** SLA-4 counts from the rider's report (`reported_at`). `crewQueue` currently uses `opened_at` for deadlines and sort order. Don't copy that pattern.
- **A wrench must disable the bike.** `recordWrench` doesn't set `bikes.is_disabled`, so a wrenched bike still looks rentable in the feed (SLA-12). No test covers this yet.
- Check `data/contract/sla.yaml` before changing anything that touches wrenches, the feed, or the queue.
