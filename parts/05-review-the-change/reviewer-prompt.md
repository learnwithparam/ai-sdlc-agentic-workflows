# The prompt for the reviewer subagent

Give this to Claude Code in `kestrel/`.

```text
Create a project subagent in .claude/agents/reviewer.md. In its frontmatter: name reviewer;
a description that says to use it to review a branch against work/spec.md, work/plan.md and
REVIEW.md before the tech lead decides; and tools: Read, Grep, Glob, Bash. Give it no Edit and
no Write tool, because a reviewer never changes the code. In the body, tell it: you review a
change you did not write. Read REVIEW.md, work/spec.md and work/plan.md first. Read the diff
with git diff main...<branch>. Run the three passes in REVIEW.md. Return each finding as a
table row in the format REVIEW.md asks for, with the criterion id it breaks. Skip style. Keep
nits under the cap in REVIEW.md. If there is no Important finding, say so plainly.
```
