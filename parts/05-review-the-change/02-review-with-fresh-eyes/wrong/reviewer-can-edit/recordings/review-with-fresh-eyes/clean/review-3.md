# Review of origin/teammate/deadline-labels against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Nit | `src/brannock-time.ts:6-13` | The label has no year and no GMT/BST marker. When the clocks go back on 25 Oct, 01:00 to 01:59 happens twice, so two deadlines an hour apart get the same label. A crew planning from the label could read a wrench deadline an hour late in that window. The UTC `deadline` field stays correct. | SLA-4 |
| Compliance | Nit | `src/brannock-time.ts:1-18`, `src/crew-queue.ts:25-28` | No plan item or acceptance criterion asks for this work. `src/brannock-time.ts` is not in the plan's list of files that change, and the spec doesn't mention `deadline_local`, a new field in the `GET /crew/queue` response. The spec and plan need updating before it merges. | P-1 to P-3 |
| Compliance | Nit | commit `61f30be` ("Show crews each deadline in Brannock time") | The commit message does not start with a plan item id (rule: one commit per plan item, `P-2: ...`). Since no item covers the change, it cannot be traced to the approved plan. | P-1 to P-3 |

Important findings left open: 0
