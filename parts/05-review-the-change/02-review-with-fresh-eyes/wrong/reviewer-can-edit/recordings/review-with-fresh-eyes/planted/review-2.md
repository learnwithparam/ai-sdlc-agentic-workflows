# Review: origin/teammate/local-deadlines against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Important | src/crew-queue.ts:22 (with src/brannock-time.ts:36) | The deadline is counted as 48h/96h on the Brannock wall clock, not 48h/96h of real time after `reported_at`, so it is off by one hour whenever the window crosses a clock change. A wrench at 2026-10-24T12:00Z is due 2026-10-26T12:00Z under the contract, but the branch shows 13:00Z. Crews who work to the queue fix bikes late, Kestrel owes credits and the 95% target suffers. Across the spring change the window becomes 47 real hours. | AC-8, SLA-4 |
| Bugs | Important | src/crew-queue.ts:36 | The queue still sorts on the shifted `deadline`, so near a clock change jobs are out of order against their real contract deadlines. A job reported in the first 01:xx BST hour on 25 Oct gets 49 real hours, while one reported minutes later in GMT gets 48. The job that is really due first drops below the other. | AC-9, AC-11, SLA-4 |
| Compliance | Nit | src/crew-queue.ts:19 | The new comment ("Crews count the hours on the depot wall clock, so we do too") contradicts the comment above it and SLA-4, so a later reader could take wall-clock counting as intended. | REVIEW.md Compliance (spec/plan) |
| Compliance | Nit | src/crew-queue.ts:32 | No tests for `deadline_local`, `src/brannock-time.ts` or a clock-change window. The existing AC-8 to AC-11 tests use times relative to now and so miss the error above. `work/plan.md` does not list `src/brannock-time.ts`, and the CLAUDE.md `crew-queue.ts` line was not updated. | P-1, P-5 |
| Bugs | Nit | src/brannock-time.ts:16 | The `deadline_local` label (e.g. "Sun 25 Oct, 14:05") has no GMT/BST marker and no year. On fall-back night 01:00 to 01:59 happens twice, so crews cannot tell which one a deadline means. | AC-8 (readability for crews) |

Important findings left open: 2
