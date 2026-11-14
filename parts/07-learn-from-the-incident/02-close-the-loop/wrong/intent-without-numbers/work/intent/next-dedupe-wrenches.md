# Intent: two riders wrench the same bike

For sign-off by the product manager. This page says what should change, not how to build it.

## Problem

When a second rider wrenches a bike that already has an open repair job, `spoke` opens a
second job (`J-W-<n>`) for the same bike. The crew queue then lists one broken bike twice,
the second copy with a later deadline. Crews can waste a visit, and the duplicate job hides
the real SLA-4 deadline, which runs from the **first** wrench.

This is not the app retry case. Retries carry the same `request_id` and are already handled.
Two riders send two different `request_id`s.

How often this happens is not yet measured. `data/wrenches.csv` can show it: a second wrench
on a bike before its `rented_again_at`.

## Proposed outcome

- One broken bike, one open job. A wrench on a bike with an open job is added to that job,
  not opened as a new one.
- The job keeps the first `reported_at`, so the SLA-4 clock (48h) never resets or slides.
- The second rider's report is still kept (its own `wrenches` row), so its fault is not lost.
- The second rider gets the existing `job_id` back, as a retry does.
- Once the job is closed, a new wrench opens a new job as today.

## Constraints

- `data/contract/sla.yaml` does not change. SLA-4: the clock starts at the wrench, 48h limit,
  £50 credit per late bike, so a late bike must count once, not once per job.
- The bike stays disabled in the feed (SLA-12). A second wrench never re-enables it.
- Retries of either rider's request still return the same job with no new rows.

## Open questions

- If the second rider reports a different fault, does the crew need to see both faults on the job?
- If a crew-found job (96h) is open and a rider then wrenches the bike, SLA-4 says the wrench is
  notice. Should the deadline tighten to 48h from the wrench?
- Should a second wrench raise the job's priority in the queue?
