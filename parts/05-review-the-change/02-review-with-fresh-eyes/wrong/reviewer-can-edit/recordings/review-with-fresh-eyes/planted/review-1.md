# Review: origin/teammate/local-deadlines (3b6dc24 "Show crews each deadline in Brannock time") against main

| Pass | Severity | Where | What goes wrong | Criterion |
| ---- | -------- | ----- | --------------- | --------- |
| Bugs | Important | `src/crew-queue.ts:20-24` (uses `src/brannock-time.ts:28-41`) | `contractDeadline` adds 48h/96h to the Brannock wall-clock time, not to the real moment of the report, so any job whose window crosses a UK clock change gets the wrong `deadline`. Autumn: a wrench reported `2026-10-24T10:00Z` gets `deadline` `2026-10-26T11:00Z` (49 real hours) while the contract breach is at `10:00Z`; crews see an hour more than the contract allows, the job can go late while showing not due (£50 credit per late bike), and it can sort below a job really due first. Spring gives 47h. Tests build `reported_at` relative to now, so they miss it. | SLA-4 (48h/96h from `reported_at`); AC-8 (`deadline` = `reported_at` + 48h/96h); AC-9/AC-11 (order by true deadline) |
| Compliance | Nit | `src/crew-queue.ts:32`, `src/brannock-time.ts` | New response field `deadline_local` and new module are in neither `work/plan.md` (P-1 to P-5) nor the spec scope; no tests for `brannock-time.ts` (including a clock change); `CLAUDE.md` doesn't mention the field. | `work/plan.md` (Files that change, Proof); spec Test notes ("Each AC ... needs at least one test") |
| Bugs | Nit | `src/brannock-time.ts:17-24, 44-46` | `deadline_local` has no year and no GMT/BST marker, so in the repeated autumn hour "Sun 25 Oct, 01:30" names two moments an hour apart. | SLA-4 (crews need an exact deadline) |

Important findings left open: 1
