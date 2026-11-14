# Review: origin/teammate/local-deadlines against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Important | src/crew-queue.ts:19-24 (with src/brannock-time.ts:27-40) | `contractDeadline` adds the 48h/96h limit to the Brannock wall-clock time instead of the real `reported_at` moment, so any window that crosses a clock change is off by one hour. A wrench at 2026-10-24T12:00Z gets a deadline of 2026-10-26T13:00Z (49 real hours); one at 2026-03-28T12:00Z gets 2026-03-30T11:00Z (47 hours). In October, crews repairing "on time" per the queue miss the contract (£50 each, counts against the 95% target); in March, the queue order is wrong. Existing tests miss it because seed jobs are relative to now. Fix: restore `Date.parse(reported_at) + limitHours * HOUR`, use Brannock time only for the label, and add an AC-8 test with a fixed `reported_at` crossing 2026-10-25 or 2026-03-29. | SLA-4, AC-8, AC-10, REVIEW.md Bugs ("Queue deadlines come from `reported_at`") |
| Bugs | Nit | src/brannock-time.ts:16-23 | The `brannockLabel` format has no year (e.g. "Sun 25 Oct, 14:05"), so a crew can't tell which year an overdue job from a stale record belongs to. | REVIEW.md Bugs (queue deadlines) |
| Compliance | Nit | src/crew-queue.ts:30-33 | Adds a new `deadline_local` field to `/crew/queue` and a new module `src/brannock-time.ts`; neither is in the spec's scope or the plan's file table, and no acceptance test covers the field or a deadline crossing a clock change. | work/spec.md Scope, work/plan.md "Files that change" / Proof |

Important findings left open: 1
