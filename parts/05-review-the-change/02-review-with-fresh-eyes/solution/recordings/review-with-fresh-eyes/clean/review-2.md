# Review: origin/teammate/deadline-labels (c6f030c) against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Nit | src/brannock-time.ts:6-13 | The label has no year and no GMT/BST marker. When UK clocks go back (Sun 25 Oct 2026), deadlines at 00:30Z and 01:30Z both read "Sun 25 Oct, 01:30", so a crew planning from the label alone could be an hour out on one of them. Only the label is affected: `deadline` and the sort stay in UTC. Adding `timeZoneName: "short"` would fix it. | SLA-4 (crews work to the contract deadline) |
| Compliance | Nit | src/crew-queue.ts:30 | `deadline_local` is not in `work/spec.md` or `work/plan.md`, and the branch adds no test for it. A later change could make the label disagree with `deadline` and no test would catch it. One test should check the label against `deadline` in summer, in winter and on the clock-change day. | work/plan.md (Proof: each item proven by a test) |

Important findings left open: 0
