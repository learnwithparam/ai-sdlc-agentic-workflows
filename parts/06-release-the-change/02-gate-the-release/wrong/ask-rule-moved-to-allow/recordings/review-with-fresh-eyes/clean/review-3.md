# Review: origin/teammate/deadline-labels against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Nit | `src/brannock-time.ts:6-13` | The label has no GMT/BST marker. When the clocks go back (next on 31 Oct 2027), 01:00 to 02:00 happens twice, so two deadlines an hour apart show the same text (for example "Sun 31 Oct, 01:15"). A crew working to the later one could finish the earlier job up to 1h late, which costs a £50 credit per late bike. The UTC `deadline` and the sort order are still correct. Fix: add `timeZoneName: "short"` to the label format. | SLA-4, AC-8 |
| Compliance | Nit | `src/crew-queue.ts:28-31` | `deadline_local` is outside the spec's scope and not in the plan's list of files. It has no acceptance test, so nothing checks that crews see the right local time, and the C-4 briefing doesn't cover crews reading the new field. | spec Scope / Test notes, plan "Files that change", C-4 |
| Compliance | Nit | `CLAUDE.md` (Architecture, `src/crew-queue.ts` line) | CLAUDE.md doesn't mention the new `src/brannock-time.ts` or the `deadline_local` field, so the next reader gets an incomplete picture of the queue. | P-5 |

Important findings left open: 0
