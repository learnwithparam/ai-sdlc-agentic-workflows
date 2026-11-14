# Review: origin/teammate/deadline-labels vs main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Nit | src/brannock-time.ts:6 | The label has no GMT/BST marker. When the clocks go back (for example 25 Oct 2026), deadlines at 00:30Z and 01:30Z both read "Sun 25 Oct, 01:30", so a crew can't tell which comes first and may be an hour late against the 48h/96h limit. `deadline` and the order are still correct. Adding `timeZoneName: "short"` removes the doubt. | SLA-4 (label only) |
| Compliance | Nit | src/crew-queue.ts:30 | No test covers `deadline_local`. Nothing checks that the label shows the same instant as `deadline` in GMT or BST, so a later change could make the label disagree with the real deadline without any test failing. | REVIEW.md Compliance (spec test notes: each behaviour needs a test) |
| Compliance | Nit | src/brannock-time.ts:1 | The Architecture section of CLAUDE.md doesn't list `src/brannock-time.ts` or the new `deadline_local` field on `/crew/queue`, so the next reader won't know the label is Brannock time while `deadline` stays UTC. | P-5 (keep CLAUDE.md accurate) |

Important findings left open: 0
