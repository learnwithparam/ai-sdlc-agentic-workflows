# Spec: wrench disables the bike, and the queue sorts by deadline

From the approved `work/intent.md`. Claude Code interviewed the product manager, then wrote this spec.

## Acceptance criteria

- **AC-1**
  - WHEN a rider sends `POST /wrench` for a bike
  - THEN `vehicle_status.json` shows that bike with `is_disabled: true` within 60 seconds
- **AC-2**
  - WHEN a rider wrenches a bike at a station
  - THEN `station_status.json` shows `num_vehicles_disabled` for that station up by 1 within 60 seconds
- **AC-3**
  - WHEN a crew asks for `GET /crew/queue?depot=North`
  - THEN the jobs come back ordered by `deadline`, the job due first on top
- **AC-4**
  - WHEN a job comes from a wrench
  - THEN its `deadline` is 48 hours after the wrench `reported_at`, because the clock starts at the wrench

## Concerns

- Operations asked for a 15 minute grace period before a wrenched bike leaves the feed. SLA-12 in the contract says the feed is accurate "at all times". A grace period breaks that clause, so this spec does not include it. Owner: the product manager takes it to the city.
