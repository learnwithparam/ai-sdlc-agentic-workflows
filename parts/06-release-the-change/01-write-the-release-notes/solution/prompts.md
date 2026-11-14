# write-the-release-notes: the prompt, what Claude wrote, what to check

`work/release.md` in this folder came from a real Claude Code run. The transcript is `recordings/write-the-release-notes/run-1.jsonl`.

## The prompt

```text
Write work/release.md, the release notes for this change. Read work/spec.md and the merged
change first: git log and git diff for the P-2 to P-5 commits. Use two sections. ## Riders is
for people who rent bikes. Write it in plain words a 12-year-old can read: short sentences, no
file names, no criterion ids, and no technical words such as feed, GBFS, API, deploy or SLA.
Say what changes for them, and thank them for reporting broken bikes. ## Crews is for the
repair crews. Say that the queue now puts the job that is due first on top, and that the 48
hour clock starts when the rider reports the bike, not when the job is opened. Keep the whole
file under 20 lines.
```

Claude Code read the spec, then ran `git log` and `git diff` on the build commits. It wrote 17 lines.

## What to check before you sign

- **Riders reads plainly.** For example: "When you report a broken bike in the app, we take it out of service right away." The check measures the grade.
- **Every rider promise is true.** "Right away" matches the first acceptance criterion. "The station map now shows how many bikes are ready to ride and how many are broken" matches the map change in P-4.
- **Crews gets the two facts that change their work.** The job due first is on top. The 48 hour clock starts when the rider reports the bike.
- **Open jobs.** Claude also wrote that jobs already open follow the same rule. That matches the spec, so keep it.

Then sign it: `bun run approve work/release.md --role pm`.

## What to reject

The vague prompt "Write release notes for this change in work/release.md." gave a careful page for engineers. That real run is in `wrong/notes-for-engineers/`. Its Riders part is full of `POST /wrench`, `is_disabled` and feed field names. It is a good changelog, but the wrong page for riders.

Also reject a late line. `wrong/edited-after-approval/` adds "Riders in every part of Brannock get this change today" after the product manager signed. That promise is false: the next step rolls out one district at a time. The hash no longer matches, so the gate is open again.
