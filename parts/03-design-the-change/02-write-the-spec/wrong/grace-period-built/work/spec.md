# Spec: a wrench takes the bike out of service

Source: `work/intent.md` (approved by PM, 2026-11-13). Contract: `data/contract/sla.yaml` (not changed).

## Acceptance criteria

**AC-1: A wrench disables the bike (SLA-12)**

- WHEN a rider sends `POST /wrench` for a bike
- THEN the bike has `is_disabled: true` in `/gbfs/v3/vehicle_status.json`, its station counts it in `num_vehicles_disabled` and not in `num_vehicles_available`, and the map shows the same counts.

**AC-2: The bike stays disabled until the job is closed**

- WHEN a wrenched bike's repair job is still open
- THEN the bike stays disabled in both feeds and on the map.

**AC-3: The feed is no more than 60 seconds old (SLA-12)**

- WHEN a client requests either GBFS feed
- THEN the response has `ttl: 60` and a `last_updated` time no more than 60 seconds old, and the data matches the database at that moment.

**AC-4: The 48 hour deadline counts from `reported_at` (SLA-4)**

- WHEN a wrench job is shown in `/crew/queue`
- THEN its `deadline` is the wrench's `reported_at` plus 48 hours, not `opened_at` plus 48 hours. Crew-found jobs keep 96 hours.

**AC-5: The job due first is listed first**

- WHEN a depot's crew queue is requested
- THEN open jobs are sorted by `deadline`, earliest first.

## Blocked: needs a PM and city decision before it is built

**AC-6: 15 minute grace period (Operations decision)**

- WHEN a rider wrenches a bike
- THEN the bike stays in `vehicle_status.json` as rentable for 15 minutes after the wrench, then leaves the feed.

This conflicts with:

- **SLA-12**: the feed must be "accurate at all times". For 15 minutes the feed would show a reported bike as rentable.
- **The approved intent and AC-1**: the bike shows as disabled "as soon as a rider reports" it. The intent names re-renting reported bikes (8.9%) as a rider safety problem, and a grace window brings it back.
- **The feed shape**: GBFS reports a broken bike as `is_disabled: true`, it does not drop it. A bike that "leaves the feed" also drops out of the station disabled counts.

Open questions from the intent still apply: what happens if the bike is rented during the window, and how to handle false reports some other way (for example, a crew member putting a bike back in service).

## Out of scope

- The North e-bike battery delays (`work/findings.md`).
- Changes to `data/contract/sla.yaml`, new packages, and deploying.
