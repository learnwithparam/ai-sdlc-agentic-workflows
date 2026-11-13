# record-the-decision: the prompts, what Claude showed, what to check

The decision record came from a real Claude Code run. The transcripts are in `parts/03-design-the-change/recordings/record-the-decision/`.

## Prompt 1

The prompt in the step's README, with the GBFS text pasted in.

Claude Code chose option 1, "keep the bike in the feed with `is_disabled: true`". It quoted the GBFS text exactly. It added a second reason of its own: the station feed counts `num_vehicles_disabled`, so dropping the bike would make the two feeds disagree. It wrote three "Good, because" lines and two "Bad, because" lines. It also set the status to "proposed", because nobody had signed it yet.

**Check before you sign:** the quote matches the GBFS page word for word. Each "Bad, because" points at a real cost in the spec, C-2, C-3 or C-4.

## What to reject

`wrong/unchecked-quote/` came from the same prompt without the pasted text. Claude Code could not open the GBFS page, so it quoted from memory: "Is the vehicle currently disabled (broken)?". The real page has no "(broken)". Claude Code did add a note: "Check it against the published text before this record is accepted." The tech lead signed it anyway. That is the mistake. A quote in a decision record is evidence, so someone must check it.

`wrong/no-options/` came from this prompt:

```text
Write a short ADR in work/decisions/0001-disable-in-feed.md: we decided to set is_disabled
on a wrenched bike.
```

Claude Code wrote a clear record of the decision, marked "Accepted". But it lists no other option, so a reader cannot see what was turned down or why. In six months, someone will suggest dropping the bike from the feed again.
