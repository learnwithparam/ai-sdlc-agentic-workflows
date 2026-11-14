# Review: origin/teammate/local-deadlines (3b6dc24) against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Important | `src/crew-queue.ts:22-23` (with `src/brannock-time.ts:27-39`) | `contractDeadline` adds 48h/96h to the Brannock wall clock instead of to the real `reported_at` moment, so any window that crosses a clock change is off by an hour. Autumn: a wrench reported 2026-10-23T12:00Z gets deadline 2026-10-25T13:00Z, but SLA-4 runs out at 12:00Z, so a crew finishing at 12:30 believes it was on time while the city counts it late. Spring: deadlines show an hour early. Fix: keep `deadline = Date.parse(reported_at) + limitHours * HOUR` as on main and use `brannockLabel` only for `deadline_local`. | SLA-4, AC-8, AC-10, REVIEW.md Bugs ("Queue deadlines come from `reported_at`") |
| Compliance | Nit | `src/crew-queue.ts:22-23` | The change is not in `work/plan.md` (P-3 says deadline is simply `reported_at` + limit) and adds no test; an AC-8 test with a window across 25 Oct or 29 Mar would have caught the Important bug. | P-3, spec Test notes ("Each AC above needs at least one test") |
| Bugs | Nit | `src/brannock-time.ts:16-23, 43-45` | `deadline_local` has no GMT/BST marker, so on the night clocks go back a label like "Sun 25 Oct, 01:30" names two moments an hour apart; `fromBrannockClock` silently picks the later one. | AC-8 (what crews read should match `deadline`) |

Important findings left open: 1
