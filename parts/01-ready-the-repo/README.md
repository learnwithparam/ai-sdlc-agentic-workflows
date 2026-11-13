# Ready the repo

This part moves the **Objective**: a repo the whole team can hand to Claude Code, with rules that hold.

## The problem

Three people opened Claude Code on Kestrel's repo last week. One wrote a `CLAUDE.md` of rules so long that Claude skipped half of them. One let Claude edit the city contract. One had no rules at all.

A rule in `CLAUDE.md` is advice. Claude Code reads it and usually follows it. A deny rule in `.claude/settings.json` is a wall: Claude Code cannot pass it, even when someone tells it to. Anthropic's best practices say the same: if something has to happen every time, put it in "a hook, a deny rule, or a managed setting" ([best practices](https://code.claude.com/docs/en/best-practices.md)).

Why it matters: Cox Communications has about 2,500 Claude Code users, "more than half of them outside engineering" ([Cox Communications](https://claude.com/customers/cox-communications-qa)). When the whole team works in one repo, the rules must live in the repo.

```mermaid
flowchart LR
  I[/init/] --> C[CLAUDE.md<br/>under 60 lines]
  C -->|@AGENTS.md| A[AGENTS.md<br/>rules for every agent]
  S[.claude/settings.json] --> D[deny: Edit and Write<br/>on data/contract]
  S --> K[ask: bun run deploy:production]
  D --> R[recorded run:<br/>Claude stopped at the contract]
```

| Step             | Minutes | What the check reads                                                                          |
| ---------------- | ------- | --------------------------------------------------------------------------------------------- |
| `ready-the-repo` | 20      | `CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, `recordings/ready-the-repo/`, the contract |

## Walkthrough

```bash
bun run start ready-the-repo
```

Expect: `kestrel/ is ready at the start of ready-the-repo.`

Then follow the step's README in Claude Code, and record the test run:

```bash
bun run record ready-the-repo
```

Expect: `Blocked by a permission rule: Edit data/contract/sla.yaml`

```bash
bun run verify ready-the-repo
```

Expect: `Done. All 8 rules pass.`

For example, without the deny rule the same recorded prompt changes `48` to `72` in the contract. The sample `wrong/no-deny-rule/` shows that real run.

## If you already know this

Put the deny rules in managed settings instead. Then write one line in `AGENTS.md` that says why one engineer can no longer turn them off.
