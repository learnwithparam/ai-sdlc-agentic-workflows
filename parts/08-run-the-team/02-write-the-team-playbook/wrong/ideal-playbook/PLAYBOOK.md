# PLAYBOOK.md: how the spoke team works with Claude Code

This is how a change moves through `spoke`, from a problem someone noticed to a release we can
measure, and which parts Claude does and which parts a person does. It describes what the repo
already does (`work/`, `REVIEW.md`, `.claude/`), and fills in the one stage we skip today: review.

One rule sits above all the others: **Claude drafts, and people decide.** Claude writes intents,
specs, plans, tests, code, reviews, postmortems and metrics. A named person approves each one
before the next stage starts. Claude never approves anything, never edits the city contract and
never ships.

---

## 1. The stages

| #   | Stage                   | Claude does                                                            | A person signs off               | Output                                     |
| --- | ----------------------- | ---------------------------------------------------------------------- | -------------------------------- | ------------------------------------------ |
| 1   | Intent                  | Drafts the problem and the outcome, with numbers from `data/` and logs | Product manager                  | `work/intent/<name>.md`                    |
| 2   | Spec                    | Writes acceptance criteria (AC-n) and concerns (C-n)                   | Product manager                  | `work/spec.md`                             |
| 3   | Plan and decisions      | Lists files, order (P-n) and proof for each step; drafts ADRs          | Tech lead                        | `work/plan.md`, `work/decisions/NNNN-*.md` |
| 4   | Failing tests           | Writes one acceptance test per AC, **before** any `src/` change        | QA                               | `test/acceptance/`                         |
| 5   | Build in small slices   | One commit per plan step, tests green after each                       | (reviewed at stage 6)            | `P-n:` commits                             |
| 6   | Review                  | The `reviewer` agent reviews the branch against `REVIEW.md`            | Tech lead decides to merge       | `work/review.md`                           |
| 7   | Release and rollout     | Drafts rider and crew notes and a staged rollout with guardrails       | Product manager, release manager | `work/release.md`, `work/rollout.yaml`     |
| 8   | Deploy                  | Nothing. A person runs it, or tells Claude "yes" for one run           | Release manager                  | `logs/deploys.log`                         |
| 9   | Incident and postmortem | Builds the timeline and impact from the logs; drafts action items      | Tech lead                        | `work/postmortem.md`                       |
| 10  | Close the loop          | Fixes action items as `A-n:` commits; adds one line to `CLAUDE.md`     | Tech lead                        | regression tests, `CLAUDE.md`              |
| 11  | Measure                 | Computes the numbers, with the command next to each one                | Engineering manager reads them   | `work/metrics.md`                          |

Then the next intent starts at stage 1 (`work/intent/next-dedupe-wrenches.md` is the current one).

### Gates

A stage starts only when the stage before it is approved. Approval is a line in
`work/approvals.jsonl`, written by the person approving:

```json
{
  "file": "work/spec.md",
  "sha256": "…",
  "role": "pm",
  "at": "2026-11-13T05:37:50Z",
  "by": "<name>"
}
```

- The `sha256` pins the exact text that was approved. If the file changes after that, the
  approval no longer counts and the file goes back for sign-off. (`work/spec.md` has two lines
  for this reason.)
- Commit the approval on its own: `approve: <file> by <role>`.
- **Claude never writes to `work/approvals.jsonl`.** If you ask Claude to "approve" something,
  it should refuse and tell you the command to run yourself.
- Start each stage with an empty commit, `Begin <stage>`, so the history shows where each stage
  began and the metrics in stage 11 can find it.

---

## 2. Stage by stage

### 1. Intent: say what should change, not how

Ask Claude for a problem with numbers and an outcome a product manager can say yes or no to.
Good intents quote their sources (the North intent cites the 600-job queue, the 212 bikes and
the 3 duplicates per bike from the postmortem). No file names, no schema, no code.

> Prompt: "Draft `work/intent/<name>.md` for the problem below. Use only numbers you can find in
> `data/` or `work/`, and cite the file for each. Don't propose a design."

### 2. Spec: criteria a test can check

Every acceptance criterion must name something a rider, crew or the city would see, and must be
checkable by one test. Concerns (C-n) are the things we know might go wrong and want watched.

- Claude loads the `city-contract` skill for anything touching wrenches, the feed or the queue.
- **If the request clashes with `data/contract/sla.yaml`, Claude does not paper over it.** It
  writes down which SLA, what was asked, and why they clash, then the product manager decides.
- Every write endpoint gets a retry criterion: the same request sent three times. (This is the
  one we missed before 2026-11-03.)

### 3. Plan: files, order, proof

The plan lists, for each step P-n, the files it touches, the order, and the command that proves
it (`bun test test/acceptance/ac-3-…`). Use plan mode or the `Plan` agent for the draft, then
edit it by hand. Anything that's a real choice (for example, disabling in the feed versus at
the station) goes in a short decision record under `work/decisions/`, signed by the tech lead.

Spell out every file path in the plan. Short names make the "files outside plan.md" metric
noisy (see `work/metrics.md`: 12 files counted as unplanned that were actually planned).

### 4. Failing tests first

Claude writes `test/acceptance/ac-<n>-<what>.test.ts` for each AC and commits them as P-1, with
no `src/` change. Run them and **watch them fail for the right reason** before QA signs off. A
test that passes before the code exists is testing nothing.

Test rules Claude must follow (from `AGENTS.md` and `CLAUDE.md`):

- Set `SPOKE_DB` and `SPOKE_LOG` to temp files, then import `src/database`.
- For write endpoints, send the same request three times and assert one row, one disable and
  the first `reported_at` kept.
- No new packages.

### 5. Build in small slices

- One plan step per commit, subject `P-n: <what a rider or crew now sees>`.
- `bun test` green after every commit. Claude runs it; it doesn't say "should pass".
- Keep commits small. Our median is about 21 lines. If a step grows past a few hundred lines,
  stop and split the plan step rather than the commit.
- If Claude finds the plan is wrong, it stops and says so. It doesn't quietly do something else.
  Fix the plan, get it re-approved, carry on.
- Delete `spoke.db` after changing tables or seed CSVs, then `bun run world` and look at the
  map and feed with your own eyes (or use the `run` skill).
- Last step updates `CLAUDE.md` so the next session knows the new behaviour.

### 6. Review: don't skip it

Today we merge Claude's pull requests after a quick look. That is how the 2026-11-03 North
double wrench shipped: nobody asked what happens when the app retries `POST /wrench`, and it
took 212 bikes out of service for over three hours. Review is where that question gets asked.

**How to run it**

1. The author (person or Claude) opens the PR with a description that links the spec and plan
   ids it covers and pastes the `bun test` output.
2. Run the `reviewer` agent on the branch in a **fresh session**, not the one that wrote the
   code. The writer's session already believes its own work. The reviewer reads `REVIEW.md`,
   `work/spec.md` and `work/plan.md` first, then does the three passes: Bugs, Security,
   Compliance.
   > "Use the reviewer agent on branch `<branch>`. Write its table to `work/review.md`."
3. For a second, independent read, run `/code-review` or `/security-review` too. Different
   reviewers miss different things.
4. **The tech lead reads the diff and the findings and decides.** "No Important findings" means
   the reviewer found nothing, not that the change is right. The tech lead still checks:
   - Does each AC in the spec have a test, and did that test fail before the change?
   - What does each write endpoint do when it's called twice, or three times?
   - Does anything touch `data/contract/sla.yaml`, `scripts/deploy.ts` or `.claude/`?
   - Would I be able to explain this change to the on-call engineer at 08:20?
5. Fix Important findings before merge. Nits (at most 3) are optional.

**What makes a finding Important** is set in `REVIEW.md`: riders, crews or the city contract
would feel it. Keep that file short and add a rule only after a real miss.

**Timebox, don't skip.** If review feels slow, make the PRs smaller. Do not make the review
lighter.

### 7. Release and rollout

Claude drafts `work/release.md` (what riders and crews will notice, in their words) and
`work/rollout.yaml` (stages by district, guardrails, rollback rule).

- Every guardrail threshold comes from `data/contract/sla.yaml`, with the SLA id in a comment.
- New behaviour goes behind a flag and rolls out one district at a time.
- The release checklist asks about **client retries** for any change to what a write endpoint
  does (postmortem A-7).

### 8. Deploy: people only

`bun run deploy:production` and `bun run rollback` need a person's "yes", every time. A yes for
one deploy is not a yes for the next one, or for a rollback. `scripts/deploy.ts` only writes to
`logs/deploys.log`, but we treat it as a real release, because the habit is what matters.

### 9. Incidents and postmortems

During an incident, Claude is useful for reading: grepping `logs/`, lining up the chat against
the incident log, counting bikes and jobs. A person makes every change to production.

Afterwards, Claude drafts the postmortem from the logs in `data/incidents/<name>/`:

- Blameless. Systems and gaps, not people.
- Every number in the impact table names its source file and time.
- Write down the discrepancies between sources rather than smoothing them over.
- Action items each have an owner role and a **check**: a command that shows it's done.
- Map the impact to each SLA, and say plainly what the logs can't show.

### 10. Close the loop

Each action item becomes commits with an `A-n:` prefix, test first (`A-1` was the regression
test, then the fix). Then add **one line** to the "Things Claude gets wrong" section of
`CLAUDE.md`, with the date and incident name, so no future session repeats the mistake. Keep
those lines short and specific; a long `CLAUDE.md` gets skimmed by people and by Claude.

### 11. Measure

Claude computes the DORA keys from `data/deploys.csv` and `data/incidents.csv`, and the feature
numbers from git, and puts the **exact command next to every number** so anyone can rerun it.
Every metrics page ends with what the numbers don't prove. One feature is one sample, and our
trailers show who was credited, not who did the work.

Keep the data honest: add every incident to `data/incidents.csv`, including D-071. Leaving one
out makes the change failure rate look better than it is.

---

## 3. Working with Claude day to day

**Give it the context it needs, in the prompt.** Name the spec ids, plan step and files. "Do
P-3 from `work/plan.md`; the proof is `ac-8` and `ac-9`" beats "fix the queue".

**Ask for proof, not promises.** Claude should run `bun test` and paste the result. If it says
"this should work", ask it to show you.

**One session per job.** Write in one session, review in another. Use `/clear` between
unrelated tasks so old context doesn't leak into new work.

**Let it say no.** If Claude refuses because of the contract, `AGENTS.md` or a missing
approval, that is the system working. Read the reason; don't reword the prompt to get around it.

**When it gets something wrong twice, write it down.** Add it to `CLAUDE.md`, `REVIEW.md` or
the `city-contract` skill, whichever reads it at the right moment. Don't rely on remembering to
say it next time.

**Credit honestly.** Commits Claude wrote carry a `Co-Authored-By: Claude …` trailer, with the
model name. The metrics depend on it (two commits in this feature missed it).

---

## 4. Guardrails already in the repo

| Guardrail                                          | Where                               | What it stops                                                 |
| -------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| Deny edits to the city contract                    | `.claude/settings.json` `deny`      | Claude changing `data/contract/sla.yaml`                      |
| Ask before deploying                               | `.claude/settings.json` `ask`       | `bun run deploy:production` without a person                  |
| Contract rules on every wrench, feed or queue task | `.claude/skills/city-contract/`     | Deadlines from `opened_at`, slow feeds, edits to the contract |
| Review that can't change code                      | `.claude/agents/reviewer.md`        | A reviewer "fixing" what it should report                     |
| Review rules and severity                          | `REVIEW.md`                         | Reviews full of style nits, missing real risks                |
| Rules for every agent                              | `AGENTS.md` (loaded by `CLAUDE.md`) | New packages, unsafe tests, deploys without a yes             |
| Signed, hashed approvals                           | `work/approvals.jsonl`              | Building on a spec that changed after sign-off                |

**Gaps to close** (each needs the tech lead's yes, since it changes `.claude/`):

- `bun run rollback` is not in the `ask` list, so only `AGENTS.md` stands between Claude and a
  rollback. Add `"Bash(bun run rollback*)"` to `ask`.
- Check that the deploy rule also catches the bare command with no arguments; if it doesn't,
  use `"Bash(bun run deploy:production*)"`.
- Nothing stops a write to `work/approvals.jsonl`. Add `Edit` and `Write` rules for it to
  `deny`.

---

## 5. Roles

| Role                | Owns                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| Product manager     | Intents, specs, release notes, conflicts with the city contract                |
| Tech lead           | Plans, decision records, `REVIEW.md`, the merge decision, postmortems          |
| QA                  | Acceptance and regression tests, and that they failed first                    |
| Release manager     | Rollout plans, deploys, rollbacks                                              |
| Engineering manager | The release checklist and the metrics                                          |
| Contract owner      | All contact with Brannock City Transport about `sla.yaml`                      |
| Claude              | Drafts at every stage; never approves, never deploys, never edits the contract |
