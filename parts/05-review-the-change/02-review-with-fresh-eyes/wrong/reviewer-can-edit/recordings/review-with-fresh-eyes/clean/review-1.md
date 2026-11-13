# Review: origin/teammate/deadline-labels against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Nit | `src/brannock-time.ts:6-13` | The label has no year and no GMT/BST marker. On the night the clocks go back (Sun 25 Oct 2026), 01:00-02:00 happens twice, so a deadline at the first 01:30 (BST) looks the same as one at the second 01:30 (GMT). A crew could think they have an hour more than they do. The UTC `deadline` field is still correct. | SLA-4 |
| Compliance | Nit | `src/crew-queue.ts:25-28`, `src/brannock-time.ts:1` | No spec criterion or plan item asks for `deadline_local`, and `src/brannock-time.ts` is not in the files `work/plan.md` lists. Work that no item asks for. It needs a spec and plan entry, or a decision to drop it. | P-1..P-3 |
| Compliance | Nit | commit `61f30be` | The commit message "Show crews each deadline in Brannock time" does not start with a plan item id (`P-n: ...`), because no plan item covers this work. Size is fine (+25/−1). | P-1..P-3 |

Important findings left open: 0
