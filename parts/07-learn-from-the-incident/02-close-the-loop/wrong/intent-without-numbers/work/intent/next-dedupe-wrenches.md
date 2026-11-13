# Intent: two riders wrenching the same bike make one repair job

## Problem

Postmortem items A-1 to A-3 deal with one rider whose app retries `POST /wrench`. An idempotency key stops those repeats.
Two different riders who wrench the same bike send two different keys. Today `POST /wrench` opens a second repair job, and with `wrench_disables_bike` on it disables the bike again.
The crew queue then shows the same bike twice. A crew can drive to it twice, and the re-enable step has to undo two jobs, not one.

## Proposed outcome

A wrench on a bike that already has an open repair job adds to that job and opens no new one. The bike stays disabled, and is disabled only once.
The 48 hour clock (SLA-4) keeps running from the first wrench. A later wrench does not restart it.

## Affected users and systems

- Riders, whose second report must still be accepted.
- Crews at the North and South depots, who work `GET /crew/queue`.
- The spoke service: `POST /wrench` in `src/wrenches.ts`, the crew queue and the GBFS feed.

## Constraints

- `data/contract/sla.yaml` does not change. The clock starts at the first wrench.
- The feed stays in GBFS v3 shape.
- The regression test goes in `test/regression/` and sends wrenches for the same bike from two riders.

## Open questions

- If the second rider reports a different defect, do we add it to the same job or open a new one?
- Once a crew closes the job, does a new wrench on the same bike open a new job? (We assume yes.)
- Does this wait for A-2, or ship with it?
