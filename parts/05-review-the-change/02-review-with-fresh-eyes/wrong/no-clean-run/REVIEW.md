# Review rules for Kestrel

Every change gets three passes. Report each finding once, under the pass that found it.

## Bugs

- Does the code do what it claims? Check error paths: if the disable update fails, the bike must not stay rentable.
- The 48 hour deadline starts at the wrench `reported_at`, not when dispatch opens the job (SLA-4).
- Sorting or filtering must not drop open jobs. Feed field names follow GBFS v3 (`is_disabled`, `num_vehicles_disabled`).

## Security

- Validate every input on public routes in `src/server.ts`, such as `POST /wrench` and `GET /crew/queue`.
- Use bound parameters for SQL. No secrets in code or logs.

## Compliance

- Check the change against `work/spec.md` (AC-1 to AC-4) and `work/plan.md` (P-1 to P-3). Flag work no item asks for.
- Check `data/contract/sla.yaml`: SLA-4 (48 h wrenched), SLA-12 (feed accurate, at most 60 seconds old).
- No edits to `data/contract/` or approved `test/acceptance/` files. One commit per plan item, under 200 lines.

## What Important means here

A finding is Important only when riders, crews or the city contract would feel it. Example: a wrenched bike still shows `is_disabled: false` after 60 seconds, so a rider rents a broken bike and SLA-12 is breached.

## Nits

At most 3 nits per review. Pick the ones that matter most and drop the rest.

## Do not report

- Anything in `data/` (recorded data, not code), and formatting.

## How to write a finding

One table row per finding. Severity is Important or Nit.

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
