# Intent: a wrench disables the bike

- **Why:** 193 of 2,160 wrenched bikes (8.9%) were rented again before a crew reached them (`work/findings.md`). The feed shows them as rentable, which breaks SLA-12 feed accuracy and puts riders on broken bikes.
- **Change:** `recordWrench` in `src/wrenches.ts` sets `bikes.is_disabled = 1` for the wrenched bike, so `vehicle_status.json`, `station_status.json` and the map stop counting it as available.
- **Done when:** a new test posts a wrench and sees the bike disabled in the feed, and `bun test` passes.
- **Out of scope:** the `opened_at` vs `reported_at` deadline bug in `crewQueue` (separate change), staffing, and `data/contract/sla.yaml` (never edited).
