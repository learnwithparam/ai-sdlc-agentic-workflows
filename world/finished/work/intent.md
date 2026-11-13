# Intent: a wrenched bike leaves the feed and reaches the right crew in time

## Problem

We fix 5.46% of wrenched bikes late, so we meet 94.54% against a 95% target. That cost 5,900 pounds in credits in 90 days.
8.94% of wrenched bikes are rented again before a crew reaches them, because the feed still shows them as rentable.

## Proposed outcome

A bike leaves the public feed as soon as a rider wrenches it. Crews see the job that is due first at the top of their queue.

## Affected users and systems

- Riders, who see the map in the app.
- Crews at the North and South depots, who work the queue.
- The spoke service: `POST /wrench`, the GBFS feed and `GET /crew/queue`.

## Constraints

- The contract in `data/contract/sla.yaml` does not change.
- The feed stays in GBFS v3 shape, so rider apps keep working.

## Open questions

- Operations asked for a 15 minute grace period before a bike leaves the feed. Does the contract allow it?
