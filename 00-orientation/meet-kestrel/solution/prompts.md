# meet-kestrel: the prompt and what to check

## The prompt

```text
My team skips the Review stage today: we merge Claude's pull requests after a quick look.
Write that as exactly one line in notes/goal.md, with no heading.
```

## What Claude Code showed

Claude Code made one file, `notes/goal.md`, with one line. It asked before it wrote the file.

## What you check before you say yes

- The file has one line. A heading or a second line fails the check.
- The line names one stage from the list. For example, "We want to use AI more" names no stage.

The end state here came from a real run. Its transcript is in `world/recordings/meet-kestrel/goal.jsonl`.
