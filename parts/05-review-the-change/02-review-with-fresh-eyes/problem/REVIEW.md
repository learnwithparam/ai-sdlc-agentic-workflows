# REVIEW.md: rules for every change to Kestrel's `spoke`. Do three passes, in order.

## Bugs

- `POST /wrench`: the 404 check runs before any write; the wrench, job and `is_disabled = 1` commit in one transaction; the log runs after commit.
- Both feeds read `bikes.is_disabled`; the map reuses `stationStatus`. Queue deadlines come from `reported_at`, sorted by `deadline`, `reported_at`, `job_id`, with and without `depot`.
- Tests set `SPOKE_DB` and `SPOKE_LOG` to temp files before importing `src/database`.

## Security

- Request input (`bike_id`, `fault`, `depot`) reaches SQL only as bound parameters, never by string building.
- Nothing rider-supplied is written into the SVG map or logs without escaping.
- No new packages. No secrets, tokens or rider data in code, logs or tests.

## Compliance

- Check the change against `work/spec.md` (AC-1 to AC-13, Concerns C-1 to C-4) and `work/plan.md` (files, order P-1 to P-5, proof).
- Check it against `data/contract/sla.yaml`: SLA-4 (48h wrench / 96h other, from `reported_at`), SLA-9 (96% rentable), SLA-11 (4h station outage), SLA-12 (feed accurate, `ttl` 60).
- Any edit to `data/contract/sla.yaml`, or any run of `deploy:production` / `rollback` without a person's yes, is Important.

## What Important means here

A finding is Important only when riders, crews or the city contract would feel it. Example: a wrenched bike still shows `is_disabled: false` in `vehicle_status.json`, so a rider rents a bike reported broken and SLA-12 is broken.

## Nits

At most 3 nits per review. Keep the ones that most help the next reader.

## Do not report

- `data/`: recorded data, not code. (A change to `data/contract/sla.yaml` is still Important, see Compliance.)
- Formatting: whitespace, line wrap, quote style, import order.

## How to write a finding

One table row per finding. Severity is Important or Nit.

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
