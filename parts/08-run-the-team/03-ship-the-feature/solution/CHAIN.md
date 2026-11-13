# The chain: from intent to playbook

This file follows one feature for spoke, Kestrel's bike-share service, from the first problem statement to the team playbook that came out of it. The feature makes a wrenched (reported broken) bike leave the public feed and reach the right repair crew within 48 hours. The rule behind it: Claude Code writes each draft, and a named person in a set role signs it. Each signature is one row in `work/approvals.jsonl`, holding the file path, its SHA-256 hash, the signer's role and name, and a timestamp. Every stage starts from the approved file of the stage before.

## The stages

**1. Intent: `work/intent.md`.** States the problem: 5.46% of wrenched bikes are fixed late, against a 95% on-time target, and 8.94% are rented again before a crew reaches them. Signed by Theo Lindqvist (pm) on 2026-10-27T14:00:00Z.

**2. Spec: `work/spec.md`.** Claude Code interviewed the product manager and turned the intent into acceptance criteria: a wrench disables the bike, and the crew queue sorts by deadline. Signed by Theo Lindqvist (pm) on 2026-10-28T16:00:00Z.

**3. Decision: `work/decisions/0001-disable-in-feed.md`.** Chooses how the GBFS feed marks a wrenched bike as disabled (AC-1). Signed by Ines Moreau (tech-lead) on 2026-10-29T10:30:00Z.

**4. Plan: `work/plan.md`.** Written in plan mode from the spec, listing the files that change. Nothing was edited before approval. Signed by Ines Moreau (tech-lead) on 2026-10-29T14:00:00Z.

**5. Acceptance tests: `test/acceptance/`.** One test file per acceptance criterion (AC-1 to AC-4), plus a helper. After this approval nobody may change these files, so the code has to change instead. Signed by Raj Patel (qa) on 2026-10-30T10:00:00Z.

**6. Review rules: `REVIEW.md`.** What a reviewer looks for, such as a clock that starts at the wrong time or a queue in the wrong order. Signed by Ines Moreau (tech-lead) on 2026-10-31T10:00:00Z. The reviewer subagent's report, `work/review.md`, has no row in the log.

**7. Release notes: `work/release.md`.** What riders and crews are told. Signed by Theo Lindqvist (pm) on 2026-11-01T11:00:00Z.

**8. Rollout: `work/rollout.yaml`.** Turns on the feature flag `wrench_disables_bike` one district at a time: North, then East, then Centre, South and West. Nobody may deploy to production until this file is approved. Signed by Mei Tanaka (release-manager) on 2026-11-01T15:00:00Z.

**9. Postmortem: `work/postmortem.md`.** On 2026-11-03 the rider app's retries of `POST /wrench` opened duplicate jobs in North, the first rollout district. The postmortem is blameless and led to the `A-1` fix. Signed by Ines Moreau (tech-lead) on 2026-11-04T11:00:00Z.

**10. Next intent: `work/intent/next-dedupe-wrenches.md`.** A follow-up problem from the postmortem: two different riders wrench the same bike and get two jobs. This starts the next chain. Signed by Theo Lindqvist (pm) on 2026-11-04T13:30:00Z.

**11. Playbook: `PLAYBOOK.md`.** Writes down how the team works with Claude Code. Signed by Dana Okafor (em) on 2026-11-05T11:00:00Z.

On 2026-11-13 the SHA-256 of each of the ten signed single files matched the hash in its approval row, so none of them has changed since it was signed. `test/acceptance/` is a directory, and that check did not cover it. `work/findings.md`, the data analysis behind the intent, has no approval row.

## Three numbers

From `work/metrics.md`, quoted exactly:

- Change failure rate: "13.0% (9 of 69 deploys have an `incident_id`)"
- Lead time for changes: "66.02 h median, `committed_at` to `deployed_at`, over 69 deploys"
- Share of commits with the `Co-Authored-By: Claude` trailer: "60.0% (18 of 30 commits)"

These numbers do not prove that this workflow made spoke faster, safer or more correct: there is no baseline to compare against, the deploy data ends before this feature's rollout was approved, and the double-wrench bug shipped anyway.

## How to check

- To see who signed what, read `work/approvals.jsonl`. It has one JSON row per approval, in time order.
- To check that a file has not changed since it was signed, run `sha256sum <file>` and compare the result with the row's `sha256`.
- `work/metrics.md` lists the command behind each number. Run them from the repo root.
