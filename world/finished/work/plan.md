# Plan: build the approved spec

Made in plan mode from `work/spec.md`. Claude Code read the code, then wrote this plan. No file changed until it was approved.

## Files that change

- `src/wrenches.ts`
- `src/crew-queue.ts`
- `src/database.ts`

## Order of work

- **P-1** Disable the bike when a wrench arrives, in `src/wrenches.ts`. Serves AC-1 and AC-2.
- **P-2** Start the deadline clock at the wrench `reported_at`, in `src/crew-queue.ts`. Serves AC-4.
- **P-3** Sort the queue by deadline, due first, in `src/crew-queue.ts`. Serves AC-3.
- **P-4** Treat a retried wrench with the same `request_id` as the same report, in `src/wrenches.ts` and `src/database.ts`. Serves action item A-1 in `work/postmortem.md`.

## Risks

- P-1 is the riskiest step: if the update fails, the bike stays rentable. The acceptance test for AC-1 catches it.
- Sorting must not drop jobs. AC-3 checks the order on all open jobs.

## Proof

- `bun test` passes, including `test/acceptance/` and `test/regression/`.
- `bun run world`, then `bun run world wrench B-2207` shows `is_disabled: true`.
