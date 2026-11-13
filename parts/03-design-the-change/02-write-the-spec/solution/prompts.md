# write-the-spec: the prompts, what Claude showed, what to check

`work/spec.md` came from a real, headless Claude Code run. The transcripts are in `parts/03-design-the-change/recordings/write-the-spec/`.

A headless run cannot interview you. So the recorded prompt gave the product manager's four answers up front:

```text
Write work/spec.md from the approved work/intent.md. Our product manager already answered
your interview questions:
- Operations still wants a 15 minute grace period before a wrenched bike leaves the feed,
  to stop false reports.
- The station counts in station_status.json must change too, not only the bike.
- Crews want the queue ordered so the job due first is on top.
- Deadlines on jobs already open should follow the contract from launch.

Use the city-contract skill. Write acceptance criteria with ids AC-1, AC-2 and so on. Give
each one a WHEN line and a THEN line, and put a number or a field name in every THEN line.
Add a ## Concerns section for anything the spec cannot do as asked: name the contract clause
and who owns the decision. No code.
```

## What Claude showed

Claude Code wrote 13 criteria and 4 concerns. It put the interview answers in a table, with what the spec does with each. Concern C-1 says the grace period breaks SLA-12, so it is not built. It names the owners: the city owns the contract, the product manager decides whether to take it to the city.

**Check before you sign:**

- AC-1 says `is_disabled: true` and 60 seconds.
- AC-8 counts the deadline from `reported_at`. AC-9 sorts by `deadline`, due first.
- C-1 to C-4 each name a clause and an owner. C-3 is real: nothing in `spoke` can close a job yet.

**One change after the run:** `bun run format` spaced out the criteria. The product manager signed the formatted file.

## What to reject

`wrong/keep-it-short/` came from this prompt:

```text
Write work/spec.md from work/intent.md. Operations has decided: a wrenched bike stays in the
feed for 15 minutes, then leaves it, to stop false reports. Put that in the spec as a
requirement. Use ids AC-1, AC-2 and so on, each with a WHEN line and a THEN line. Keep it short.
```

Claude Code refused to make the grace period a requirement, because the skill told it so. That part is good. But "keep it short" cost two things. AC-6 sorts the queue "oldest first by `reported_at`", which puts a 96 hour crew job above a 48 hour wrench job due sooner. And the conflict sits under "Blocked", not `## Concerns`, so the next stages will not find it.

We also tried to get a spec that builds the grace period. Without the skill, and even with "the city agreed on the phone", Claude Code still refused. Those transcripts are kept too. Your gate is still the backstop: a person reads each criterion before signing.
