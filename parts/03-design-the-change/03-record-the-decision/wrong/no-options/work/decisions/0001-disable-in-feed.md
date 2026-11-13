# 0001. A wrench disables the bike in the feed

- Status: Accepted
- Date: 2026-11-13

## Context

When a rider presses the wrench button, `recordWrench` (`src/wrenches.ts`) adds a `wrenches` row and a `repair_jobs` row. It does not touch `bikes.is_disabled`. The GBFS feed (`src/feed.ts`) and the map work out disabled and available counts from `bikes.is_disabled` alone. So a bike a rider has just reported as broken still shows as rentable.

The contract (`data/contract/sla.yaml`) says:

- **SLA-4:** "A rider pressing the wrench button is notice of a defect."
- **SLA-12:** "Real-time data in the public feed is accurate and available to the public at all times."

A bike we have been told is broken but still list as available breaks SLA-12. It also sends the next rider to a broken bike.

## Decision

`recordWrench` sets `bikes.is_disabled = 1` for the wrenched bike. It does this in the same request that writes the `wrenches` and `repair_jobs` rows, so the next feed response shows the bike as disabled. This matches the seed path in `src/database.ts`, which already disables bikes that have open jobs.

A test will cover it: after `POST /wrench`, `vehicle_status.json` reports the bike with `is_disabled: true`, and the station's `num_vehicles_available` and `num_vehicles_disabled` counts change to match.

## Consequences

- The feed and map show wrenched bikes as disabled at once, which meets SLA-12.
- Every wrench lowers the rentable share of the fleet (SLA-9, minimum 96%). We think that is right, because a broken bike was never really rentable, but false or duplicate wrenches will now cost availability. Fast triage matters more.
- Re-enabling a bike is the repair flow's job. Closing a repair job must clear `is_disabled`, or bikes stay out of service for good. That work is out of scope here.
- `data/contract/sla.yaml` does not change.
