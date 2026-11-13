# How the spoke team works with Claude Code

## Our AI stance

Claude Code writes the first draft of every stage. A person reads it and signs the gate. Nobody merges what nobody read.

## Gates

| File                                     | Who approves    | How it is recorded                                         |
| ---------------------------------------- | --------------- | ---------------------------------------------------------- |
| `work/intent.md`                         | pm              | `bun run approve work/intent.md --role pm`                 |
| `work/spec.md`                           | pm              | `bun run approve work/spec.md --role pm`                   |
| `work/decisions/0001-disable-in-feed.md` | tech-lead       | `bun run approve ... --role tech-lead`                     |
| `work/plan.md`                           | tech-lead       | `bun run approve work/plan.md --role tech-lead`            |
| `test/acceptance/`                       | qa              | `bun run approve ... --role qa`                            |
| `work/rollout.yaml`                      | release-manager | `bun run approve work/rollout.yaml --role release-manager` |

## Never do

- Edit `data/contract/`: a deny rule in `.claude/settings.json`.
- Change an approved acceptance test: a deny rule.
- Run `bun run approve`: a deny rule.
- Deploy without a person: an ask rule on `bun run deploy:production`.

## Size of a change

At most 200 changed lines per commit.

## When we use the factory

A change that is small, has an approved spec and is covered by tests can run without a person in the loop. Everything else comes through these gates.
