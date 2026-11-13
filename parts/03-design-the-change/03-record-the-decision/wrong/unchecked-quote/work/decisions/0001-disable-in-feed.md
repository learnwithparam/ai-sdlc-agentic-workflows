# 0001. A wrenched bike stays in the feed with is_disabled: true

## Context and Problem Statement

AC-1 in `work/spec.md` requires that once `POST /wrench` returns 201, riders and third-party
apps stop seeing the bike as rentable, within SLA-12's 60 seconds ("accurate and available to the
public at all times"). How should `/gbfs/v3/vehicle_status.json` show a bike that has been
reported broken but not yet fixed?

## Considered Options

1. Keep the bike in `vehicle_status.json` and set `is_disabled: true`.
2. Drop the bike from the feed until it is fixed.

## Decision Outcome

Chosen option: "Keep the bike in the feed and set `is_disabled: true`", because the GBFS v3
reference has a field for exactly this case. It describes `is_disabled` as "Is the vehicle
currently disabled (broken)?", with `true` meaning "The vehicle is disabled". Dropping the bike
would hide the fact that the field exists to state. `station_status.json` counts it under
`num_vehicles_disabled`, so dropping it from `vehicle_status.json` would make the two feeds
disagree (AC-3, AC-4, AC-5). That breaks SLA-12 accuracy.

> Quote taken from the GBFS v3.0 reference (`vehicle_status.json`, field `is_disabled`).
> Check it against the published text before this record is accepted.

## Consequences

- Good, because feed users can tell "broken, at station S" apart from "rented out" or "gone".
  Without that, a missing bike could mean any of the three.
- Good, because it matches what the seed already does for the 40 open jobs and what `feed.ts`
  already emits, so the vehicle and station feeds and the map stay consistent.
- Good, because a false report can be undone by clearing one flag (C-3). The bike never leaves
  the feed, so nothing has to bring it back.
- Bad, because apps that ignore `is_disabled` may still show the bike as rentable. Dropping it
  would protect those apps too.
- Bad, because the public can see how many broken bikes there are (C-2, C-4), which the city
  and third-party apps will notice.
