# capture-the-intent: the prompts, what Claude showed, what to check

`work/intent.md` came from a real Claude Code run. The transcripts are in `parts/02-plan-the-change/recordings/capture-the-intent/`.

## Prompt 1

The prompt in the step's README.

Claude Code read `work/findings.md`, `CLAUDE.md` and the contract. It wrote the five headings in order. Under Problem it quoted "193 of 2,160" and "8.9%" for re-rents, and "118 of 2,160", "5.5%" and "£5,900" for late bikes. Under Open questions it put the 15-minute grace period, and asked if it fits SLA-12, "accurate at all times".

**Check before you sign:**

- Every number under Problem is in `findings.md`, written the same way.
- Proposed outcome says what riders and crews will see. It names no function and no file in `src/`.
- Constraints names `data/contract/sla.yaml` and says it does not change.

Then the product manager signed it:

```bash
bun run approve work/intent.md --role pm
```

Expect: `Approved work/intent.md as pm`

## What to reject

- A Proposed outcome that says how to code it ("set `is_disabled` in `recordWrench`"). That belongs in the plan.
- An intent with no open questions. The grace period is still open, and Part 3 needs it.

## The weak prompts

`wrong/skipped-the-template/` came from "Write work/intent.md for this change. Keep it to a few lines." Claude Code wrote four bullets: why, the code change, a test and what is out of scope. It went straight to the fix in `src/wrenches.ts`. There are no headings, no constraints and no open questions, so the product manager signs a code change, not an outcome.

`wrong/edited-after-approval/` started from the signed intent. Then this prompt went in:

```text
Operations still wants the two extra crews. Add one bullet to Proposed outcome in
work/intent.md: hire two more repair crews for the North depot. Change nothing else.
```

Claude Code added the line, and warned that it clashes with the Problem section. The signature in `approvals.jsonl` still holds the old hash, so the check fails. That is the gate working: a change after signing needs a new signature.
