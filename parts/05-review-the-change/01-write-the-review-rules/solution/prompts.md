# write-the-review-rules: the prompt, what Claude wrote, what to check

`REVIEW.md` in this folder came from a real Claude Code run. The transcript is `recordings/write-the-review-rules/run-1.jsonl`.

## The prompt

```text
Write REVIEW.md at the root of this repo: the rules a reviewer follows on every change to
Kestrel. Read work/spec.md, work/plan.md and data/contract/sla.yaml first. Use one ## section
for each of the three passes: Bugs, Security, Compliance. Under Compliance, say to check the
change against work/spec.md and work/plan.md. Add a section called What Important means here:
a finding is Important only when riders, crews or the city contract would feel it, with one
example from Kestrel. Add a section called Nits that allows at most 3 nits per review. Add a
section called Do not report that lists data/ (recorded data, not code) and formatting. Add a
section called How to write a finding: one table row per finding with the columns Pass,
Severity, Where, What goes wrong, Criterion, where Severity is Important or Nit. Keep the file
under 40 lines.
```

Claude Code read the spec, the plan, the contract and the code first. Then it wrote a file of 39 lines.

## What to check before you sign

- **The Important example is from Kestrel.** Claude wrote: a wrenched bike still shows `is_disabled: false` after 60 seconds, so a rider rents a broken bike. That is real, and it names SLA-12.
- **Compliance names the ids.** It lists AC-1 to AC-4 and P-1 to P-3, so a reviewer can cite them.
- **The Bugs pass names the clock.** "The 48 hour deadline starts at the wrench `reported_at`." This line helps the reviewer in the next step.
- **The finding table is there.** The next step reads findings by the Severity column.

Then sign it: `bun run approve REVIEW.md --role tech-lead`.

## What to reject

A short prompt, "Write a REVIEW.md with code review guidelines for this repo", gave seven sections of checklists in a real run. That file is in `wrong/wall-of-checklists/`. It is careful, but it has no cap on nits and no meaning for Important. Its passes are not Bugs, Security and Compliance. A reviewer that follows it comments on everything.

Also reject a late edit. `wrong/edited-after-approval/` adds one line after the tech lead signed: "Time zone code in `src/`. Sam already tested it on his machine." That line would hide the bug in the next step. The hash no longer matches, so the gate is open again.
