# Release notes: a wrenched bike leaves the feed and reaches the right crew in time

Built from the approved `work/intent.md`, `work/spec.md`, `work/decisions/0001-disable-in-feed.md` and `work/plan.md`.
Commits on `main`: `a44adf6` (P-1), `c12460e` (P-2), `714a689` (P-3).

## Why

We fixed 118 of 2,160 wrenched bikes late (5.46%). That puts us at 94.54% against the 95% contract target and cost 5,900 pounds in credits over 90 days.
Another 193 wrenched bikes (8.94%) were rented again before a crew reached them, because the feed still showed them as rentable. See `work/findings.md`.

## What changes

### Riders: a wrenched bike stops being rentable at once (P-1, AC-1, AC-2)

- `POST /wrench` now sets `is_disabled: true` on the bike, so it shows as disabled in `vehicle_status.json`.
- `num_vehicles_disabled` in `station_status.json` goes up by 1 for that station.
- The wrench, its repair job and the disabled flag are written in one transaction. If any write fails, none of them lands, so the feed never shows a bike as wrenched but still rentable (SLA-12).
- The bike stays in the feed, marked disabled, and is not removed. Decision 0001 explains why: GBFS defines `is_disabled` for this case, and crews still need to find the bike.

### Crews: the deadline clock starts at the wrench (P-2, AC-4)

- A wrench job's `deadline` is now 48 hours after the wrench `reported_at`, as SLA-4 says. Before, the clock started when the dispatch desk opened the job.
- Jobs found by a crew keep their 96 hour limit, now also counted from `reported_at`.

### Crews: the queue puts the job due first on top (P-3, AC-3)

- `GET /crew/queue?depot=...` returns jobs sorted by `deadline`, earliest first. Jobs with the same deadline keep the oldest-opened job first.
- Before, the queue was sorted oldest-opened first. The North crew should notice the new order straight away.

## What does not change

- The feed keeps the GBFS v3 shape. Rider apps need no update.
- `data/contract/` does not change.
- No database migration and no new routes.

## Known limits and open items

- **No 15 minute grace period.** Operations asked for one, but SLA-12 says the feed must be accurate "at all times". The product manager is taking the question to the city.
- **Third-party maps** may show wrenched bikes greyed out instead of hiding them (decision 0001).
- **Not in this release:** `teammate/local-deadlines`. `work/review.md` lists 2 open Important findings on it: its deadlines are an hour off when summer time starts or ends.

## Proof

- Acceptance tests in `test/acceptance/`, one per criterion, approved by QA on 2026-11-02.
- Run `bun test` before releasing. It was not run when these notes were written.
- Manual check from the plan: `bun run world`, then `bun run world wrench B-2207` should show `is_disabled: true`.

## Rollout

- The release manager approves `work/rollout.yaml` before `bun run deploy:production` runs.
- If anything goes wrong, `bun run rollback` goes back to the last good release. P-1 to P-3 only change code, with no schema change, so a rollback needs no data fix. Bikes this release disabled keep `is_disabled = 1` after a rollback. Check how they get re-enabled before rolling back.
