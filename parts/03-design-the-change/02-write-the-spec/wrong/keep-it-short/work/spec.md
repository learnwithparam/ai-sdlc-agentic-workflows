# Spec: a wrench takes the bike out of service

Source: `work/intent.md`. Contract: `data/contract/sla.yaml` (unchanged).

## Acceptance criteria

**AC-1: Wrench disables the bike**
WHEN a rider sends `POST /wrench` for a bike
THEN that bike's `bikes.is_disabled` is set to 1 in the same request.

**AC-2: Feed shows the bike disabled within 60 seconds (SLA-12)**
WHEN a bike has been wrenched
THEN `/gbfs/v3/vehicle_status.json` shows it with `is_disabled: true` within 60 seconds of the wrench, and the 60s `ttl` is unchanged.

**AC-3: Station counts reflect the wrench**
WHEN a bike at a station has been wrenched
THEN `/gbfs/v3/station_status.json` and the map (`/`) show that station with one fewer available bike and one more disabled bike.

**AC-4: Bike stays out of service until the job closes**
WHEN a wrench repair job for a bike is still open
THEN the bike stays `is_disabled: true` in the feed.

**AC-5: Queue deadline counts from the wrench (SLA-4)**
WHEN `/crew/queue` lists a job with `source='wrench'`
THEN its `deadline` is `reported_at` + 48 hours, not `opened_at` + 48 hours.

**AC-6: Queue order counts from the wrench (SLA-4)**
WHEN `/crew/queue` lists open jobs
THEN they are sorted oldest first by `reported_at`.

## Blocked: 15-minute grace period (needs product manager decision)

- **Request (Operations):** a wrenched bike stays in the feed as available for 15 minutes, then leaves it, to stop false reports.
- **Conflicts with:** SLA-12, "accurate and available to the public at all times", `feed_max_age_seconds: 60`.
- **Why they clash:** for 15 minutes the feed would show a reported bike as rentable, 14 minutes past the 60-second limit. That is the rider-safety problem the intent sets out to fix (8.9% re-rent rate).
- **Status:** not a requirement. It conflicts with AC-2, which stays in force. Only the city can change SLA-12. If false reports are the worry, look at options that keep the bike disabled, such as a crew "return to service" without a full repair (intent, open questions).

## Out of scope

- Changing `data/contract/sla.yaml` or the feed `ttl`.
- New packages.
