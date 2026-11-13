# How we review a change

## Bugs

Look for wrong results: a clock that starts at the wrong time, a queue in the wrong order, a feed that lags.

## Security

Look for input from the rider app that spoke trusts without a check.

## Compliance

Check the change against `work/spec.md` and `work/plan.md`. Every criterion id needs a test. Every changed file needs a plan item.

## What Important means here

A finding is Important when riders, crews or the contract would feel it. For example, a wrenched bike still shows as rentable.

## Nits

Report at most 3 nits per review.

## Do not report

- Anything in `data/`. That is recorded data, not code.
- Formatting. Biome handles it.
