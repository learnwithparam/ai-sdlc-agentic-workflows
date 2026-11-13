# 0001. Show a wrenched bike as disabled in the feed

Status: proposed. Date: 2026-11-13. Spec: `work/spec.md` AC-1.

## Context and Problem Statement

When a rider sends `POST /wrench`, the bike must stop looking rentable in the public GBFS feed
at once (AC-1, SLA-12: "accurate and available to the public at all times", 60 second limit).
Today a wrenched bike still shows as rentable. How should `vehicle_status.json` show a bike
that has an open wrench?

## Considered Options

1. Keep the bike in `vehicle_status.json` with `is_disabled: true` until it is fixed.
2. Drop the bike from `vehicle_status.json` until it is fixed.

## Decision Outcome

Chosen option: 1, "keep the bike in the feed with `is_disabled: true`", because it is what
GBFS v3 defines the field for. The reference says: "This field is used to indicate vehicles
that are in the field but not available for rental due to a mechanical issue or low battery
etc. Publishing this data may prevent users from attempting to rent vehicles that are disabled
and not available for rental." A wrenched bike is still in the field and has a mechanical
issue, so it fits exactly. It also keeps the vehicle feed in line with `station_status.json`,
where AC-4 needs `num_vehicles_disabled` to rise by one. Dropping the bike would leave the
station counting a disabled bike that the vehicle feed no longer lists.

## Consequences

- Good, because riders and third-party apps can see the bike is there but cannot be rented,
  which is the warning the GBFS reference describes.
- Good, because the vehicle and station feeds agree (AC-3, AC-4), and the map follows (AC-5).
- Good, because it reuses the existing `bikes.is_disabled` column. No new state is needed.
- Bad, because feed users now see more disabled bikes, so they need notice (spec C-4).
- Bad, because the bike stays disabled until a job can be closed, and no route does that yet
  (spec C-3). This adds to the SLA-9 risk in C-2. Option 2 has the same problem.
