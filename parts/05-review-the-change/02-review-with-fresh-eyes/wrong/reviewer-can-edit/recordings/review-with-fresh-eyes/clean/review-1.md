# Review: origin/teammate/deadline-labels (c6f030c) against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Nit | src/brannock-time.ts:6 | The label shows no GMT/BST marker. On the night the clocks go back (next on Sun 31 Oct 2027), 01:00 to 01:59 happens twice, so two deadlines an hour apart get the same label, such as "Sun 31 Oct, 01:30". A crew reading the later one would think it is due an hour early. That errs on the safe side, so it is not a contract miss. Adding `timeZoneName: "short"` would fix it. | REVIEW.md Bugs (queue deadlines) |
| Compliance | Nit | src/crew-queue.ts:30 | No test covers `deadline_local`. A wrong time zone or format would reach crews with nothing to catch it. The obvious checks are one summer case, one winter case and the clocks-back hour. | work/spec.md Test notes; work/plan.md Proof |
| Compliance | Nit | src/brannock-time.ts:1 | The change is outside the plan. `src/brannock-time.ts` is not in the plan's file table or in P-1 to P-5, and the CLAUDE.md `crew-queue.ts` line does not mention the new field. The next reader won't know the label exists or that it is display-only. | work/plan.md Files that change / P-5 |

Important findings left open: 0
