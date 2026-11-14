# Intent: one open repair job per wrenched bike

For sign-off by the product manager. This page says what should change, not how to build it.

## Problem

`POST /wrench` now handles retries: a repeated `request_id` returns the existing `job_id` and
writes nothing. But that only covers one rider's app resending the same report. When two
different riders wrench the same bike, each report has its own `request_id`, so each one opens
its own repair job (`J-W-<wrench id>`), even though the bike already has an open wrench job.

The 2026-11-03 North double wrench (`work/postmortem.md`) showed what duplicate jobs for one
bike do, even though the cause there was retries:

- The North crew queue grew to about **600** open jobs, against a normal **40**. Every
  duplicate job got its own 48h deadline and buried real jobs in the deadline order.
- **212** bikes had to be re-enabled by a script because their only open jobs were duplicates.
- Each affected bike showed up **3** times in the queue.

Reports from different riders won't come in bursts like a retry storm, but they pile up in the
same way on bikes at busy stations: one bike, several open jobs, several deadlines, and crews
sent to the same bike more than once. Postmortem action item A-5 already asks for "no bike with
more than one open wrench job" in the crew queue, and today a second rider is enough to break
that.

## Proposed outcome

- A bike has at most one open wrench repair job at a time.
- When a rider wrenches a bike that already has an open wrench job, the report is still
  recorded (it is a separate rider's notice of a defect), but no new repair job opens. The
  rider gets back the existing `job_id`.
- The open job keeps the first rider's `reported_at`. Its deadline and its place in the crew
  queue don't move when later reports come in.
- The bike stays disabled; a later report doesn't disable it again or change the feed.
- Once a crew closes the job, the next wrench on that bike opens a new job as it does today.
- Retries with the same `request_id` keep working as they do now.
- Success measure: the crew queue never shows a bike with more than one open wrench job
  (the A-5 check: `curl -s 'localhost:4100/crew/queue?depot=North'`).

## Affected users and systems

- **Riders:** the second and later riders to report a bike get the existing job back instead
  of a new one. What the app shows them may need to change (see open questions).
- **Crews (North and South depots):** fewer queue entries; one visit per broken bike. The job
  may need to show that several riders reported it, and which faults they gave.
- **Operations:** queue size and per-depot workload figures drop to the real number of broken
  bikes. Reports that count jobs per day will count fewer.
- **Brannock City Transport:** SLA-4 lateness is counted per late bike; one job per bike makes
  that count match the queue.
- **Systems:** `POST /wrench` (`src/wrenches.ts`), the `wrenches` and `repair_jobs` tables, the
  crew queue (`/crew/queue`). The GBFS feed and the map should not change, since the bike is
  already disabled after the first report.

## Constraints

- `data/contract/sla.yaml` does not change. Only the city edits it.
- **The 48 hour clock in `data/contract/sla.yaml` does not change.** SLA-4 says the clock starts
  at the wrench, with a 48 hour limit for wrenched bikes. For a bike with several reports, the
  clock starts at the first one. A later report must never restart it, extend it or move the
  job's deadline.
- SLA-12: the feed stays accurate and no more than 60 seconds old. The bike stays disabled from
  the first report until a crew closes the job.
- Retries stay safe: the same `request_id` sent three times returns the same `job_id`, with no
  new row and no second disable. Tests must send each request three times, and also send two
  reports for the same bike with different `request_id`s.
- Crew-found jobs (96h, `source` not `wrench`) are out of scope unless we decide otherwise
  below.
- No new packages. The service stays on what Bun has built in.
- Production deploy and rollback need a person's approval.

## Open questions

- If the second rider gives a different fault (say `BRAKES` after `FLAT_TYRE`), is that the
  same job with an extra fault, or a separate defect that needs its own job?
- What should the second rider see: a `200` with the existing `job_id`, a `201`, or a message
  like "already reported, thanks"? Does the app depend on the status code?
- Should the crew queue show how many riders reported a bike? Should more reports raise its
  priority, without moving the SLA-4 deadline?
- If a bike has an open crew-found job (96h clock) and a rider then wrenches it, does the
  rider's report start a 48h clock on that job, or open a wrench job? SLA-4 says a wrench is
  notice of a defect, so the 48h limit should apply from the wrench; we need to confirm how.
- Two riders reporting the same bike at the same moment: is it acceptable to rely on the
  database transaction to make sure only one job opens?
- Bikes that already have more than one open wrench job when this ships: do we merge them
  (keeping the earliest `reported_at`), close the extras, or leave them? Postmortem action A-6
  (a duplicate cleanup script) may cover this.
- How has the city counted SLA-4 credits for bikes with several open jobs until now: once per
  bike or once per job? This links to A-8.
