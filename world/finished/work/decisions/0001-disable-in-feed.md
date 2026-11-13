# 0001: Mark a wrenched bike as disabled in the feed

## Context and Problem Statement

A wrenched bike must stop being rentable at once (AC-1). The GBFS feed gives two ways to do that.

## Considered Options

- Mark `is_disabled` on the bike and keep it in `vehicle_status.json`.
- Drop the bike from the feed until it is fixed.

## Decision Outcome

Chosen option: mark `is_disabled`. The GBFS reference says `is_disabled` is "used to indicate vehicles that are in the field but not available for rental due to a mechanical issue". That is our case exactly. Crews also need to find the bike.

## Consequences

- Good, because rider apps already know the field, and `num_vehicles_disabled` counts stay right.
- Bad, because a bike stays visible on third-party maps, greyed out, which some riders may misread.
