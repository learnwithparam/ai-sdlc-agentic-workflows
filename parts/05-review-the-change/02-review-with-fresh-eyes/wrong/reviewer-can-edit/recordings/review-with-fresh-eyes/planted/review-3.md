# Review: origin/teammate/local-deadlines against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Important | src/crew-queue.ts:22 | `contractDeadline` adds 48h/96h to the Brannock wall clock instead of to the `reported_at` instant, so any job whose window crosses a UK clock change gets the wrong deadline. Autumn: a wrench at 2026-10-24T12:00Z (13:00 BST) gets 2026-10-26T13:00Z, 49 real hours; a crew finishing at 48.5h thinks it was on time while the city counts it late (£50 credit, drags the 95% target). Spring: jobs crossing 28 Mar 2027 get 47h/95h. Either way these jobs sort against correctly-dated ones, so the job due first is not always on top. | SLA-4, AC-8, AC-9, AC-10, AC-11 |
| Bugs | Nit | src/brannock-time.ts:37 | `fromBrannockClock` takes the UTC offset at the "as-if-UTC" instant, so for wall times that happen twice (25 Oct 2026 01:00–02:00) or not at all (28 Mar 2027 01:00–02:00) it silently picks or invents an instant. Another reason to keep deadline maths in UTC and use Brannock time only for the label. | REVIEW.md Bugs (queue deadlines from `reported_at`) |
| Compliance | Nit | src/crew-queue.ts:32 | No test covers the change. AC-8 to AC-11 pass only because seed and test timestamps are relative to `Date.now()` and no clock change falls in the next 96h; they will start failing on their own in the days before 28 Mar 2027. A test with fixed `reported_at` values either side of a clock change would catch the bug. | Spec test notes ("Each AC above needs at least one test"), P-3 proof |
| Compliance | Nit | src/brannock-time.ts:1 | The new file and the `deadline_local` field are not in the spec, the plan's file list, or the CLAUDE.md `crew-queue.ts` line, so the next reader has no AC or decision explaining why the queue speaks Brannock time. | P-3, P-5 |

Important findings left open: 1
