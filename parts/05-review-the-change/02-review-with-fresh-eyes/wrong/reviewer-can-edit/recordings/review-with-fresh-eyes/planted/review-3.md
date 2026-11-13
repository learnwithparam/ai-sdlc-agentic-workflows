# Review: origin/teammate/local-deadlines against main (commit 51c399a)

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Important | `src/crew-queue.ts:22-24` (with `src/brannock-time.ts:27-39`) | The 48 h or 96 h limit is added to the Brannock wall clock, not to the real `reported_at` moment. So the deadline is wrong whenever a UK clock change falls inside the window. In autumn, a wrench at 13:05Z on Fri 23 Oct gets 14:05Z on Sun 25 Oct, which is 49 real hours. In spring, a wrench at 12:00Z on Fri 27 Mar gets 11:00Z on Sun 29 Mar, which is 47 hours. Crews who work to the label can miss SLA-4. In the autumn window, jobs can also be sorted in the wrong order. Fix: keep `Date.parse(reported_at) + limitHours * HOUR` and use Brannock time only for the `deadline_local` label. | AC-4, SLA-4 |
| Compliance | Nit | `src/brannock-time.ts:1` | No plan item asks for a `deadline_local` field or a new `src/brannock-time.ts`. P-1 to P-3 don't cover it, so it is unplanned work. | P-2 |
| Compliance | Nit | commit 51c399a | The commit message "Show crews each deadline in Brannock time" has no plan item id at the start, as CLAUDE.md asks (for example `P-2: ...`). The size, 59 lines, is under the limit. | P-2 |
| Bugs | Nit | `src/brannock-time.ts:16-23` | `labelFormat` does not show GMT or BST. When the clocks go back, a label such as "Sun 25 Oct, 01:30" can mean either of two moments an hour apart. | AC-4 |

Important findings left open: 1
