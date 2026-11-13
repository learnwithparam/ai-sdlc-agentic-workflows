# Kestrel spoke

@AGENTS.md

## Commands

- `bun run world` starts spoke on http://localhost:4100.
- `bun test` runs every test. Run it after each change.
- `bun run deploy:production` deploys spoke. A person approves the release first.
- `bun run rollback` rolls spoke back to the last good release.

## Conventions

- Each stage writes one file in `work/`. Read the approved file before the next stage.
- One commit per plan item. Start the message with the item id, for example `P-2: ...`.
- Keep each commit under 200 changed lines.
- Feed field names follow GBFS v3, for example `is_disabled` and `num_vehicles_disabled`.

## Architecture

- `src/server.ts` lists every route.
- `src/feed.ts` builds the public feed. `src/wrenches.ts` takes wrench reports.
- `src/crew-queue.ts` lists open repair jobs for a depot.
- `src/database.ts` fills SQLite from `data/` the first time spoke starts.

## Things Claude gets wrong

- The 48 hour clock starts at the wrench, not when the dispatch desk opens the job.
- A retried wrench report with the same `request_id` is the same report, not a new one.
