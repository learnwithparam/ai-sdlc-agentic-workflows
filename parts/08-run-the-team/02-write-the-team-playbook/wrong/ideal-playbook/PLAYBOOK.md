# Playbook: how the spoke team works with Claude Code

This is how we want to work, not a record of how we always have. It builds on `AGENTS.md` (rules for every agent), `CLAUDE.md` (rules for Claude Code), `REVIEW.md` (how we review) and what we learned from the first feature through the pipeline, "broken bikes leave the map", and the North double wrench incident (`work/postmortem.md`).

## Our AI stance

- **Claude writes drafts. People make decisions.** Claude Code drafts specs, plans, code, tests, release notes, rollouts and postmortems. A named person approves each one, and no stage starts until the stage before it is approved. Claude never approves anything, for itself or for anyone else.
- **A person owns every line that ships.** The `Co-Authored-By: Claude` trailer says who helped write a commit. It does not move responsibility. The person who merges the change answers for it.
- **Files, not chat.** Every stage writes one file in `work/`. The next stage, and the next person or agent, reads that file and nothing else. A decision that lives only in a chat window has not been made.
- **Proof over confidence.** A change is done when `bun test` passes and the plan's own proof steps work, not when Claude says it is done. Claude's mistakes sound exactly like its correct answers, so we check both the same way.
- **The contract wins.** `data/contract/` is the city's contract. When a spec, plan or code touches wrench reports, the public feed or the crew queue, Claude loads the `city-contract` skill first.
- **Lessons go where the next agent will read them.** After an incident or a repeated mistake, we add the lesson to "Things Claude gets wrong" in `CLAUDE.md`. The retried wrench lesson is there because of North.
- **We are honest about what we measure.** `work/metrics.md` shows the process held: 0 files outside the plan, 0 spec changes after the plan. The same feature still shipped a bug that took 212 bikes out of service. Following the process is necessary, not sufficient. A trailer share is not a productivity number.

## Gates

Each gate is a person's approval, recorded as a line in `work/approvals.jsonl` with the file, its sha256, the role, the time and the name. If the file changes after approval, the hash no longer matches and the approval no longer counts: get it approved again.

| #   | Stage              | File Claude drafts                     | Who approves    | What they check                                                                                             |
| --- | ------------------ | -------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Intent             | `work/intent.md` or `work/intent/*.md` | PM              | The problem is real, the outcome is clear, the open questions are listed, not guessed.                      |
| 2   | Spec               | `work/spec.md`                         | PM              | Every acceptance criterion has an id (AC-n) and can be tested. Contract numbers come from `data/contract/`. |
| 3   | Decision           | `work/decisions/NNNN-*.md`             | Tech lead       | The options and the trade-off are written down, with the one chosen.                                        |
| 4   | Plan               | `work/plan.md`, made in plan mode      | Tech lead       | Every file that will change is named. Every item (P-n) serves an AC id. Risks and proof are listed.         |
| 5   | Acceptance tests   | `test/acceptance/`                     | QA              | One test per AC id. Every write route is tested with the same request sent twice. Frozen once approved.     |
| 6   | Review rules       | `REVIEW.md`                            | Tech lead       | What counts as Important for riders, crews and the contract.                                                |
| 7   | Build and review   | commits `P-n: ...`, then a review      | Tech lead       | The `reviewer` agent's report (Bugs, Security, Compliance) is read and every Important finding is closed.   |
| 8   | Release notes      | `work/release.md`                      | PM              | Riders and crews can understand it.                                                                         |
| 9   | Rollout            | `work/rollout.yaml`                    | Release manager | A flag, stages by district, guardrails from the contract, and a rollback that turns off what went wrong.    |
| 10  | Deploy             | `bun run deploy:production`            | Release manager | Only after gate 9. The release manager is present and watching the guardrails.                              |
| 11  | Postmortem, if any | `work/postmortem.md`                   | Tech lead       | Blameless, sourced from logs, every action item has an owner and a check that can fail.                     |

How the gates are enforced:

- `.claude/settings.json` denies edits to `data/contract/` and `test/acceptance/`, denies `bun run approve`, and asks before `bun run deploy:production`. These are hard stops for Claude Code.
- Other agents do not read `.claude/settings.json`. For them, `AGENTS.md` is the rule and review is the check.
- "Read the approved file before the next stage" is a habit, not a lock. The reviewer checks it at gate 7: every changed file must be in the plan, every AC id must have a test.

## Never do

For Claude and for people working with Claude:

- **Never edit `data/contract/`.** The city owns it. If the contract looks wrong, raise it with the PM.
- **Never change a file in `test/acceptance/` after QA approved it.** If a test fails, change the code. If the test itself is wrong, that is a new spec and a new QA approval, not a quiet fix.
- **Never run `bun run approve`, and never write a line into `work/approvals.jsonl` by hand for someone else.** An approval is a person's decision.
- **Never run `bun run deploy:production` before the release manager approved `work/rollout.yaml`.** Approving the deploy prompt is not the same as that approval.
- **Never start a stage from a draft.** Start from the approved file of the stage before: intent, spec, decision, plan.
- **Never edit an approved file and carry on.** A changed file has a new hash. Send it back to its approver.
- **Never change a file the plan does not name.** If the build needs another file, stop, update the plan, and get it approved again.
- **Never start the 48 hour clock when the dispatch desk opens the job.** It starts at the wrench `reported_at` (SLA-4).
- **Never ship a write route that is not idempotent.** The rider app retries. A repeat `request_id` returns the existing job and opens no new job or disable. Test it by sending the same request twice.
- **Never rename feed fields away from GBFS v3** (`is_disabled`, `num_vehicles_disabled`). Rider apps depend on them.
- **Never let Claude review its own build.** Use the `reviewer` agent in a fresh context, then a person decides.
- **Never paste rider data, incident logs or contract terms into outside tools or services** to get help with them.

## Size of a change

- **One plan item, one commit.** The message starts with the item id: `P-2: start the deadline clock at reported_at`. Postmortem fixes use the action id: `A-1: ...`.
- **Under 200 changed lines per commit.** If an item will not fit, the plan item is too big. Split it in the plan and get the plan approved again. Do not split the commit to dodge the limit.
- **Test first when fixing a bug.** Commit the failing test, then the fix, as two commits: `e161f69` then `7dcb13b` for A-1. The first commit shows the bug; the second shows the fix.
- **Run `bun test` after every change**, not only before the push.
- **One feature per branch, one plan per feature.** The next feature (`work/intent/next-dedupe-wrenches.md`) gets its own spec and plan; it does not ride along on a fix.
- **For reference:** the first feature changed 2 files in 3 plan commits, and the median commit was 16 lines. That median includes many one-line `approve:` commits, so it is not a target for code.
- **Small for Claude means small for the reviewer too.** A diff a person cannot read in one sitting is a diff nobody really reviewed.

## When we use the factory

"The factory" is the full pipeline in Gates: intent, spec, decision, plan, frozen acceptance tests, build, independent review, release notes, flagged rollout by district, and a postmortem if it goes wrong. It is slow on purpose: the first feature took 27.5 hours from intent to spec alone, and that elapsed time includes a night and an approval wait.

**Use the full factory when the change:**

- changes what riders see, in the public feed or the rider app's responses,
- changes the crew queue, its order or its deadlines,
- touches anything named in `data/contract/` (availability, feed age, the 48 and 96 hour clocks),
- adds or changes a write route such as `POST /wrench`,
- changes the database schema or how `src/database.ts` loads `data/`,
- needs a feature flag or a district-by-district rollout,
- or leaves an open question that a person must answer. The dedupe intent has three; the factory is where they get answered.

**Use the short path for a postmortem action item:** the action already has an owner and a check in an approved postmortem. Write the regression test in `test/regression/` (`A-n: regression test ...`), then the fix (`A-n: ...`), run `bun test`, and send the branch to the `reviewer` agent and the tech lead. It still deploys through gates 9 and 10.

**Skip the factory** for changes no rider, crew or contract would notice: typos, comments, docs like this one, internal refactors with no behaviour change and `bun test` green, dev tooling. These still follow Never do and Size of a change, and still get a person's review before merge.

**When unsure, use the factory.** Its cost is hours of waiting. The North incident cost 212 bikes for over three hours of a morning peak, from a change that had been through every gate but missing one test. When the factory misses something, we add the missing check to it: a new line in `CLAUDE.md`, a regression test, a guardrail in `rollout.yaml`.
