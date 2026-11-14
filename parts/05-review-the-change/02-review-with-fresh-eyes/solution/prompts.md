# review-with-fresh-eyes: the prompts, what Claude did, what to check

Every file in this folder came from a real Claude Code run. The transcripts are in `recordings/review-with-fresh-eyes/`.

## Prompt 1: make the reviewer

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

Claude Code wrote `.claude/agents/reviewer.md`. The transcript is `make-the-reviewer.jsonl`.

**Check before you say yes:**

- The line "tools: Read, Grep, Glob, Bash" is there. With no `tools:` line, a subagent gets every tool, Edit and Write too. That mistake is in `wrong/reviewer-can-edit/`.
- The body keeps "Skip style". Anthropic's [best practices](https://code.claude.com/docs/en/best-practices.md) page says: "Don't drop the `skip style` part of that prompt. A reviewer that's asked to find problems will always find _something_."
- Claude added a line of its own: "Use Bash only to read". Keep it. A tool list cannot stop a shell command, so this line and the permission rules do that job.

## Prompt 2: the review

Start a new session first, so Claude Code loads the subagent. Then:

```text
Use the reviewer subagent to review the branch origin/teammate/local-deadlines against main.
Then write its findings to work/review.md: a one-line heading, the findings table exactly as
REVIEW.md asks, and a last line 'Important findings left open: N'.
```

Claude Code handed the job to the reviewer. The reviewer read `REVIEW.md`, the spec and the plan, then the diff. It worked out real deadlines around both clock changes and found 49 hours in autumn and 47 in spring. It also tried to write a small test script. The permission rules stopped that, because a reviewer only reads. The transcript is `first-review.jsonl`.

**Check before you decide:** the Important finding names `src/crew-queue.ts`, the clock change and AC-4. The tech lead sends the branch back to Sam.

## The recorded runs

`record.ts` asked for the same review 3 times on each branch, each in a fresh copy of `kestrel/`.

| Branch                     | Run 1                  | Run 2                  | Run 3                  |
| -------------------------- | ---------------------- | ---------------------- | ---------------------- |
| `teammate/local-deadlines` | bug found, 2 Important | bug found, 1 Important | bug found, 1 Important |
| `teammate/deadline-labels` | 0 Important, 3 nits    | 0 Important, 3 nits    | 0 Important, 3 nits    |

On the clean branch, the reviewer still noticed that the label hides GMT or BST. It called that a nit, because the real deadline stays right. That is the meaning of Important in `REVIEW.md` at work.

**What to reject:** a review of only the planted branch. It shows that the reviewer finds bugs, but not that it stays quiet when there are none. That mistake is in `wrong/no-clean-run/`.
