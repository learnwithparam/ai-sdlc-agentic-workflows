# Plan: a wrench takes the bike out of service

Builds `work/spec.md` (AC-1 to AC-13). Contract: `data/contract/sla.yaml` (read-only). No grace period (C-1), no close-job route (C-3).

## Files that change

| File                        | Change                                                                                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/wrenches.ts`           | Wrap the `wrenches` insert, the `repair_jobs` insert and `UPDATE bikes SET is_disabled = 1` in one `database.transaction(...)` (AC-1, AC-2, AC-6). Log only after commit. 404 path stays before any write (AC-7). |
| `src/crew-queue.ts`         | `contractDeadline` uses `reported_at`, not `opened_at` (AC-8, AC-10). Sort by `deadline`, then `reported_at`, then `job_id` (AC-9, AC-11). Fix the comments that say the clock runs from `opened_at`.             |
| `test/wrench.test.ts` (new) | AC-1 to AC-7, AC-13: feed and station counts before/after a wrench, repeat wrench, unknown bike, map vs feed, rollback when one write fails.                                                                      |
| `test/queue.test.ts` (new)  | AC-8 to AC-11: deadline from `reported_at` (48h / 96h), sort order and tie-break, seed jobs move earlier by their gap and none overdue, depot filter.                                                             |
| `test/feed.test.ts`         | Add AC-12 (`ttl` 60, `version` "3.0", `last_updated` within 60s).                                                                                                                                                 |

Not touched: `src/feed.ts`, `src/map-page.ts` (already read `bikes.is_disabled`), `src/database.ts`, `data/`, `sla.yaml`.

## Order of work

1. Write the failing tests first: AC-1, AC-3, AC-4 (wrench) and AC-8, AC-9 (queue). Confirm they fail for the right reason.
2. Fix `src/wrenches.ts` (transaction + disable). Run `bun test test/wrench.test.ts`.
3. Fix `src/crew-queue.ts` (deadline + sort). Run `bun test test/queue.test.ts`.
4. Add the remaining tests (AC-2 rollback, AC-5, AC-6, AC-7, AC-10, AC-11, AC-12, AC-13).
5. `bun test` all green. Smoke check with `bun run world`: wrench a bike, read both feeds, `/`, and `/crew/queue`.
6. No deploy. `bun run deploy:production` waits for a person to say yes (AGENTS.md).

## Risks

- **Partial writes.** Today three inserts are separate; a crash between them leaves a job without a disabled bike. Mitigation: one transaction; AC-2 test forces the second write to fail (e.g. duplicate `job_id`) and checks nothing is kept.
- **`job_id` collision.** `J-${Date.now()}` can repeat for two wrenches in the same millisecond (likely in tests). Within the transaction this would roll back the wrench. Keep the format but note it; if tests hit it, add a short suffix rather than change the schema.
- **Test isolation.** `src/database` reads `SPOKE_DB`/`SPOKE_LOG` at import; each test file sets temp paths before importing and seeds a fresh DB. Pick bikes with `is_disabled = 0` from the DB, not hard-coded IDs.
- **Queue order change is visible to crews** (C-4) and deadlines move up to 1.0h earlier. Behaviour is per spec; flag to the product manager before release.
- **SLA-9 headroom** drops as more bikes are disabled (C-2). Not fixable in code; Operations owns it.
- **Timestamp parsing.** Seed `reported_at` values are ISO strings made relative to now; compare via `Date.parse`, not string compare, for deadlines.

## Proof

- Every AC has at least one named test; `bun test` passes with output pasted in the PR.
- AC-1 test fails on the current `main` and passes after the change (shows the bug was real).
- AC-10 test: for all 40 seed jobs, `deadline` = `reported_at` + limit, shift equals `opened_at − reported_at` (0.1h to 1.0h), 0 overdue.
- Manual run of `bun run world`: one wrench flips the bike to `is_disabled: true` in `vehicle_status.json`, station counts move by −1 / +1, `/` matches, docks unchanged.
- `git diff --stat` shows no change to `data/contract/sla.yaml` or `data/*.csv`.
