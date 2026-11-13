# Intent: two riders wrench the same bike, and the crew gets one job

## Problem

When two different riders wrench the same bike, each report opens its own repair job. Each rider's report has its own `request_id`, so the retry check from postmortem action A-2 does not catch it.
The postmortem shows what duplicate jobs cost. In the North incident, duplicate jobs took 212 bikes out of service, and North availability fell from 97.8% to 89.0%, a drop of 8.8 points. The North crew queue held about 600 jobs against a normal level of about 40.
Those duplicates came from app retries, not from different riders. We have not measured how often two riders wrench the same bike. But each extra job does the same harm: it fills the crew queue and costs crew time on a bike that already has a job.

## Proposed outcome

A bike has at most one open repair job. A wrench on a bike that already has an open job adds the new report to that job. It opens no new job and does not disable the bike again.

## Affected users and systems

- Riders who wrench a bike that another rider already wrenched.
- Crews at the North and South depots, who work the queue.
- The spoke service: `POST /wrench` in `src/wrenches.ts` and `GET /crew/queue` in `src/crew-queue.ts`.

## Constraints

- The 48 hour clock in `data/contract/sla.yaml` (SLA-4, `wrenched_limit_hours: 48`) does not change. It starts at the first rider's wrench, and a later report on the same bike must not restart it or move it later.
- The contract in `data/contract/` does not change.
- `POST /wrench` stays idempotent: a repeat `request_id` still returns the existing job and opens no new job or disable.
- The feed stays in GBFS v3 shape, so rider apps keep working.

## Open questions

- How often do two different riders wrench the same bike? We need a count from `data/` before we size the change.
- When does a second wrench count as a new fault instead of the same one? For example, after the crew closes the job, or after a set time.
- If the second rider reports a different fault, should the crew see both reports on the one job?
