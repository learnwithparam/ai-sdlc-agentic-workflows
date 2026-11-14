# Review: origin/teammate/deadline-labels (c6f030c) against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Nit | src/brannock-time.ts:7-13 | The label has no time-zone marker (GMT/BST). On the night the clocks go back, 01:00-01:59 happens twice, so a crew reading "Sun 25 Oct, 01:30" cannot tell which one is meant: a one-hour doubt on an SLA-4 deadline. Adding `timeZoneName: "short"` removes it. | SLA-4 |
| Compliance | Nit | src/crew-queue.ts:30 | No test covers `deadline_local`. Nothing checks that it matches `deadline` or that it shifts by an hour across a clock change, so a wrong label would reach crews with no test failing. | REVIEW.md Compliance (work/plan.md: every change comes with proof) |
| Compliance | Nit | src/brannock-time.ts:1-3 | Crews get a new queue field that the spec, plan and C-4 crew briefing do not mention; PM and Operations should know before release. | C-4 |

Important findings left open: 0
