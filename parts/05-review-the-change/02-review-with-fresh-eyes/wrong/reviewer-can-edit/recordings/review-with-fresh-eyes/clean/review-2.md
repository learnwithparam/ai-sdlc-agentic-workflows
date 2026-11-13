# Review: origin/teammate/deadline-labels against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Compliance | Nit | src/crew-queue.ts:27 (with new file src/brannock-time.ts:1-18) | No plan item or criterion asks for the `deadline_local` label. `work/plan.md` lists only P-1 to P-3, `src/brannock-time.ts` is not in the plan's "Files that change", and the spec never mentions local-time labels. The label needs its own spec and plan item before it merges. | P-3 |
| Compliance | Nit | commit 61f30be ("Show crews each deadline in Brannock time") | The commit message has no `P-n: ...` prefix, which CLAUDE.md requires. It can't have one, because no plan item covers this work. The commit is under the 200-line limit. | P-1 to P-3 (one commit per plan item) |
| Bugs | Nit | src/brannock-time.ts:6-13 | The label shows neither the time zone nor the year. On the night the clocks go back (Sun 25 Oct 2026), 00:30Z and 01:30Z both read "Sun 25 Oct, 01:30", so a crew could think a job is due an hour later than it is. The UTC `deadline` that sorting and SLA checks use is still correct. | SLA-4 |

Important findings left open: 0
