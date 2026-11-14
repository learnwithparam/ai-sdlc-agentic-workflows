# Review: origin/teammate/deadline-labels (c6f030c) against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Nit | src/brannock-time.ts:6 | The label has no GMT/BST marker. On the night the clocks go back (Sun 25 Oct 2026), deadlines of 00:30Z and 01:30Z both read "Sun 25 Oct, 01:30" even though one is due an hour earlier. The order stays correct, but a crew can't tell the two apart from the label. Adding `timeZoneName: "short"` fixes it. | SLA-4 (crews work to the deadline) |
| Compliance | Nit | src/crew-queue.ts:30 | No AC in `work/spec.md` and no file in `work/plan.md` covers the new `deadline_local` field, and no test checks it. If the label drifted from `deadline` (a different instant or a broken time zone), nothing would catch it. | REVIEW.md Compliance (spec/plan check); spec "Test notes" |
| Compliance | Nit | CLAUDE.md (crew-queue line) | The Architecture note for `src/crew-queue.ts` still lists only `deadline`, so the next reader won't know the queue also returns `deadline_local` or that it is display-only. | P-5 (keep CLAUDE.md accurate) |

Important findings left open: 0
