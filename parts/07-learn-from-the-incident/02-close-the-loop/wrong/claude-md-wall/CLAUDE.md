# Kestrel spoke

@AGENTS.md

## Commands

- `bun run world` starts spoke on http://localhost:4100.
- `bun test` runs every test. Run it after each change.
- `bun run deploy:production` deploys spoke. A person approves the release first.
- `bun run rollback` rolls spoke back to the last good release. It rolls back the whole release. It does not turn a feature flag off for one district.

## Conventions

- Each stage writes one file in `work/`. Read the approved file before the next stage.
- One commit per plan item. Start the message with the item id, for example `P-2: ...`.
- Keep each commit under 200 changed lines.
- Feed field names follow GBFS v3, for example `is_disabled` and `num_vehicles_disabled`.
- Put new regression tests in `test/regression/`, never in `test/acceptance/`. Write the failing test first, then the fix.

## Architecture

- `src/server.ts` lists every route.
- `src/feed.ts` builds the public feed. `src/wrenches.ts` takes wrench reports.
- `src/crew-queue.ts` lists open repair jobs for a depot.
- `src/database.ts` fills SQLite from `data/` the first time spoke starts.

## Things Claude gets wrong

- The 48 hour clock starts at the wrench, not when the dispatch desk opens the job.
- The rider app retries a failed `POST /wrench` up to 3 times. Every write route must treat a repeat of the same report as one report. `POST /wrench` has no duplicate check yet (postmortem A-1, A-2).
- With the `wrench_disables_bike` flag on, every wrench report also disables the bike. A duplicate report then costs a bike, not just a queue entry.
- Tests that send each request once can miss duplicates. When a route writes, also test the same request sent twice.
- North availability is normally 97.8%. The `work/rollout.yaml` guardrail is 96% for 10 minutes, and nothing enforces it automatically yet.

See `work/postmortem.md` and `data/incidents/north-double-wrench/` for the double wrench incident of 2026-11-03.
