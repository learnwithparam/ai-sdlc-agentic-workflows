# Review: origin/teammate/local-deadlines against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Important | src/crew-queue.ts:22-24 (with src/brannock-time.ts:27-39) | `contractDeadline` now adds 48 h to the London wall clock instead of to the real moment, so any window that crosses a clock change is off by an hour. Autumn: a wrench at 2026-10-24T13:05Z (14:05 BST) gets a deadline of 2026-10-26T14:05Z, which is 49 real hours. Crews are told they have an hour more than the contract allows, so a bike fixed in that hour breaches SLA-4. Spring: a wrench at 2026-03-28T12:00Z gets 2026-03-30T11:00Z, which is 47 h. The 96 h inspection limit shifts the same way, and the queue order (AC-3) follows the wrong deadlines. | AC-4, SLA-4 |
| Compliance | Nit | src/brannock-time.ts:1, src/crew-queue.ts:29 | No plan item asks for this work. The plan does not list `src/brannock-time.ts`, and no item asks for `deadline_local` or for wall-clock counting. The change rewrites deadline logic that P-2 owns, and the comment at src/crew-queue.ts:19 ("Crews count the hours on the depot wall clock") contradicts SLA-4. A local-time label should go through spec and plan, and be computed from the real UTC deadline. | P-2 |
| Compliance | Nit | commit 51c399a | The commit message does not start with a plan item id (for example `P-2: ...`). Its size, under 200 lines, is fine. | P-2 |
| Compliance | Nit | src/crew-queue.ts:20-25 | The AC-4 acceptance test will probably still pass and miss this bug. Its fixture times are relative to "now", so it fails only when it runs within 48 h before a clock change. A green `bun test` does not prove the deadline is right. | AC-4 |

Important findings left open: 1
