# Review of origin/teammate/local-deadlines against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Important | `src/crew-queue.ts:20-25` (with `src/brannock-time.ts:27-39`) | `contractDeadline` adds 48 hours on the Brannock wall clock instead of 48 real hours. When BST ends, a wrench at Sat 24 Oct 2026 11:00Z gets a deadline of Mon 26 Oct 12:00Z, which is 49 hours. Crews see a deadline an hour after the contract's, and a bike fixed in that hour is late. When BST starts the error goes the other way: a wrench at 28 Mar 2026 12:00Z gets 30 Mar 11:00Z, which is 47 hours. | AC-4 / SLA-4 |
| Compliance | Important | commit `51c399a`, `src/brannock-time.ts` (new file) | No plan item asks for wall-clock deadlines or a `deadline_local` label. P-1 to P-3 do not cover them, and `src/brannock-time.ts` is not in the plan's files that change. The commit message does not start with a plan item id. | P-1..P-3; one commit per plan item |
| Bugs | Nit | `src/crew-queue.ts:37-42` | Around the October clock change the queue can sort jobs in the wrong order. A job wrenched at 25 Oct 00:30Z gets 27 Oct 01:30Z. A job wrenched at 01:10Z gets 27 Oct 01:10Z, so it goes on top even though it is really due second. The AC-3 test sorts by the returned deadline, so it cannot catch this. | AC-3 |

Important findings left open: 2
