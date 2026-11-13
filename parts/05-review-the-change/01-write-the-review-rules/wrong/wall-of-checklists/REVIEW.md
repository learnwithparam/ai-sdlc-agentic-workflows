# Reviewing changes to spoke

How to review a change to Kestrel spoke, by a person or by a coding agent.
The rules in `AGENTS.md` and `CLAUDE.md` still apply. This file says what a reviewer checks.

Block the change if any **Blocker** below fails. Other problems are comments, and the author decides.

## 1. Protected files — Blocker

- [ ] No change under `data/contract/`. The city owns the contract. If the code needs a different rule, the code is wrong or the PM must go to the city.
- [ ] No change under `test/acceptance/` after QA approved it (see `work/approvals.jsonl`). A failing acceptance test means change the code.
- [ ] No new or edited line in `work/approvals.jsonl` written by an agent. Only a person approves, through `bun run approve`.
- [ ] No change to an approved `work/` file (intent, spec, decision, plan) unless the change comes with a new approval. Check that its sha256 still matches `work/approvals.jsonl`:

  ```sh
  sha256sum work/plan.md   # compare with the "sha256" for work/plan.md
  ```
- [ ] No change to `.claude/settings.json` that loosens the `deny` or `ask` rules.

## 2. Traceability to the approved plan — Blocker

- [ ] Each commit serves one plan item, and its message starts with the item id, for example `P-2: ...`.
- [ ] The change only touches files `work/plan.md` lists under "Files that change". Any other file needs a reason in the PR, or a plan update with a new approval.
- [ ] The change does what the plan item and its acceptance criteria in `work/spec.md` say, and nothing more. Extra features wait for their own spec.
- [ ] Each commit is under 200 changed lines (`git show --stat <sha>`).

## 3. The city contract — Blocker

Read `data/contract/sla.yaml` before reviewing code in `src/wrenches.ts`, `src/feed.ts` or `src/crew-queue.ts`.

- [ ] **SLA-4: the clock starts at the wrench.** Deadlines are computed from `reported_at`, never from `opened_at`. A wrench gets 48 hours; a defect a crew finds gets 96 hours. This is the mistake agents make most often in this repo.
- [ ] **SLA-12: the feed is accurate at all times.** A wrenched bike shows `is_disabled: true` straight away. No grace period, no cache, no batch job that delays it past 60 seconds.
- [ ] **The wrench is atomic.** The wrench row, the repair job and `is_disabled = 1` are written in one transaction. A failure must never leave a broken bike rentable.
- [ ] **The crew queue never drops jobs.** Sorting and filtering keep every open job for the depot. The job due first goes on top.
- [ ] Contract numbers (48, 96, 60, 50) match `sla.yaml`. Prefer reading them from the contract over a new hard-coded copy.

If a change conflicts with the contract, do not approve it with a workaround. Ask for the conflict to be written down and sent to the PM.

## 4. Public feed — Blocker for field names

- [ ] Feed field names follow GBFS v3: snake_case, for example `is_disabled`, `num_vehicles_available`, `num_vehicles_disabled`. No invented names, no renamed fields.
- [ ] Removing or changing the meaning of a feed field is a breaking change for outside apps. It needs a decision record in `work/decisions/`.
- [ ] Station counts agree with the bikes table: a disabled bike counts as disabled, not available.

## 5. Correctness and code

- [ ] SQL uses bound parameters (`?`, `?1`). No values joined into a query string.
- [ ] Times are stored and compared as UTC ISO 8601 strings (`toISOString()`). Watch for local time and for sorting dates as text in mixed formats.
- [ ] Requests with a missing or unknown `bike_id`, `station_id` or `depot` return a clear 4xx, not a crash.
- [ ] Every new route is listed in `src/server.ts`.
- [ ] Changes to seeding in `src/database.ts` still work on a fresh start and on an existing database.
- [ ] Comments say why, and name the SLA when a rule comes from the contract (as in `src/crew-queue.ts`).
- [ ] Events that matter to operations (wrench, repair, disable) are logged with `logEvent`.

## 6. Tests

- [ ] `bun test` passes, including `test/acceptance/`. Run it yourself; do not trust the PR text.
- [ ] New behaviour has a unit test in `test/`, outside `test/acceptance/`.
- [ ] Tests that touch the contract check the edge: a job at exactly 48 hours, a crew-found defect, a tie on deadline.
- [ ] No test skipped, weakened, or made to pass by changing what it checks.

## 7. Release

- [ ] Nobody ran `bun run deploy:production` before the release manager approved `work/rollout.yaml`.
- [ ] The PR says how to check the change after release and that `bun run rollback` is the way back.

## How to write review comments

- Say what is wrong, where (`src/file.ts:line`), and why. Name the SLA, acceptance criterion or plan item it breaks.
- Mark each comment **Blocker** or **Suggestion**.
- Point to the approved file that settles the question rather than arguing taste. If no approved file settles it, it is a suggestion.
