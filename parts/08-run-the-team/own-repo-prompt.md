# The prompt for ship-in-your-own-repo

Run this from your own repo, once the tests are green and the review is done.

```text
Write own-repo.md for the feature this repo just got. Read SPEC.md and git log first, and run
the tests. Use these headings in this order: ## Repo, ## Ticket, ## Spec, ## Proof, ##
Commits, ## Review. Repo is one line: what the project does. Ticket is the problem in three
lines at most, with one real number from the ticket. Spec lists each acceptance criterion as
its id, then WHEN and THEN on one line. Proof has two bullets: Red, the command and the line
it printed when the tests ran on the first commit, before any code change, with how many
tests failed, and Green, the command and the line it printed now, with 0 failed. Commits has
one line for each commit that starts with P-: its hash, its subject and its changed lines
(from git show --shortstat). Review is two sentences: what the reviewer found, and what you
will do about it. Use only numbers and output you ran or read. Do not change any other file,
and do not commit.
```
