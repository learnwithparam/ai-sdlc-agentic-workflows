# CHAIN.md: from intent to playbook

This page follows one feature in `spoke`, Kestrel Bike Share's service for Brannock, from the
first statement of the problem to the team's written way of working. The feature: when a rider
reports a broken bike with the wrench button (`POST /wrench`), the bike leaves service at once
in the public GBFS feed and on the map, and crew queue deadlines count from the rider's report.

Every stage below is a file. A sign-off is a line in `work/approvals.jsonl` that records the
file's `sha256`, the signer's role, their name and the time. When a file was signed twice, the
later line is the one that counts. On 2026-11-14 the current contents of each signed file
matched the hash in its latest line. `test/acceptance` is a folder, so its hash was not
re-checked.

## The stages

**1. Intent: `work/intent.md`.** This states the problem without saying how to fix it.
193 of 2,160 wrenched bikes (8.9%) were rented again before a crew reached them, and the queue
counted deadlines from when a job was opened, not from the rider's report. It lists open
questions, the main one being a 15 minute grace period that operations asked for. Signed by
**Theo Lindqvist (pm)** on 2026-11-13 at 05:27 UTC.

**2. Spec: `work/spec.md`.** This turns the intent into acceptance criteria AC-1 to AC-13 and
concerns C-1 to C-4, and records the PM's answers. The grace period is not built because it
conflicts with SLA-12 (feed accuracy). Signed by **Theo Lindqvist (pm)** twice, at 05:37 and
again at 05:38 after a revision.

**3. Decision: `work/decisions/0001-disable-in-feed.md`.** This chooses to keep a wrenched bike
in `vehicle_status.json` with `is_disabled: true` rather than drop it from the feed, because
that is what GBFS v3 defines the field for. Signed by **Ines Moreau (tech-lead)** at 05:40 and
again at 05:44.

**4. Plan: `work/plan.md`.** This names the files that change and the order of work (P-1 to
P-5). It also lists today's faults: the wrench writes are not in a transaction, the bike is
never disabled, and the queue sorts by `opened_at`. Signed by **Ines Moreau (tech-lead)** at
05:52.

**5. Acceptance tests: `test/acceptance/`.** One test file per criterion, `ac-1` to `ac-13`,
plus `helpers.ts`. Signed by **Raj Patel (qa)** at 05:58.

**6. Review rules: `REVIEW.md`.** Three passes in order: bugs, security, compliance against the
spec, the plan and `data/contract/sla.yaml`. Signed by **Ines Moreau (tech-lead)** at 09:00.
(`work/review.md`, one review written against these rules, has no sign-off line.)

**7. Release notes: `work/release.md`.** Plain-language notes for riders and crews. Signed by
**Theo Lindqvist (pm)** at 10:00.

**8. Rollout: `work/rollout.yaml`.** A district-by-district rollout behind the
`wrench_disables_bike` flag (North, then East, then Centre, then South and West). Its stop
limits come only from the contract: 96% rentable fleet (SLA-9), and 95% of repairs on time
within 48 hours (SLA-4). Signed by **Mei Tanaka (release-manager)** at 11:00.

**9. Postmortem: `work/postmortem.md`.** A blameless account of the 2026-11-03 North double
wrench. Deploy D-071 turned the flag on in North, the rider app retried `POST /wrench` up to 3
times, and each retry opened a new job. 212 bikes had to be re-enabled by a script, and North
availability fell from 97.8% to 89.0%. Signed by **Ines Moreau (tech-lead)** at 15:00.

**10. Next intent: `work/intent/next-dedupe-wrenches.md`.** The postmortem leads to the next
piece of work: one open repair job per wrenched bike, even when two different riders report it.
Signed by **Theo Lindqvist (pm)** on 2026-11-14 at 09:00.

**11. Playbook: `PLAYBOOK.md`.** This writes down how the team works with Claude Code: Claude
drafts, and a person in a named role signs each file that gates the work, by recording the
file's hash. Signed by **Dana Okafor (em)** on 2026-11-14 at 12:00.

## Numbers

From `work/metrics.md`, copied exactly as written there:

- Lead time for changes: "**66.02 h** median, committed_at to deployed_at (69 deploys)"
- Change failure rate: "9 of 69 deploys have an incident_id = **13.0%**"
- Share of commits with Co-Authored-By: Claude: "11 of 17 = **64.7%**"

These numbers do not prove that this feature, or Claude, made the team faster or safer: the
DORA figures stop at D-069 on 2026-10-31, before this feature shipped and without the North
incident, and the 17 commits are one feature with no control group to compare against.

## How to check this page

Run `sha256sum` on any file above and compare the result with its latest line in
`work/approvals.jsonl`. The commands behind each number are in `work/metrics.md`.
