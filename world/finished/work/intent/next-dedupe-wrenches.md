# Intent: two riders wrench the same bike

## Problem

During the incident, 212 bikes had duplicate jobs. A retry is fixed now, but two different riders can still wrench the same bike and open two jobs.

## Proposed outcome

One open job per bike, however many riders report it.

## Affected users and systems

- Crews, who see the queue.
- `POST /wrench` in spoke.

## Constraints

- The 48 hour clock still starts at the first wrench, as `data/contract/sla.yaml` says.

## Open questions

- Should the second report add its fault to the open job?
