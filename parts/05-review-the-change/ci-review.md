# Run the review rules on every pull request

A rules file that only runs on your laptop is easy to forget. The same file can run on every pull request, so a review lands before a person opens the page. Claude Code has a headless mode for this. It reads `REVIEW.md` from the repo, so the rules you just signed are the rules the robot follows.

Try it by hand first, in your repo, on Sam's branch. This is an extra for the step `write-the-review-rules`:

```bash
git diff main...origin/teammate/local-deadlines | claude -p "Review this diff with the rules in REVIEW.md. Answer with the findings table only."
```

Expect: a findings table with the five columns from `REVIEW.md`. In our run the first row was an Important finding in `src/crew-queue.ts` about the clock change, with SLA-4 and AC-8 as the criteria. Wording changes from run to run, and there are never more than 3 Nit rows.

In CI the job does the same thing. This is a sketch to copy into your own repo, so the course does not ship it as a workflow file:

```yaml
name: review
on: pull_request
jobs:
  review:
    runs-on: ubuntu-latest
    permissions: { contents: read, pull-requests: write }
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - run: npm install -g @anthropic-ai/claude-code
      - run: git diff origin/${{ github.base_ref }}...HEAD | claude -p "Review this diff with the rules in REVIEW.md." > review.md
        env: { ANTHROPIC_API_KEY: "${{ secrets.ANTHROPIC_API_KEY }}" }
      - run: gh pr comment ${{ github.event.pull_request.number }} --body-file review.md
        env: { GH_TOKEN: "${{ github.token }}" }
```

Keep the key in a secret, and let the job comment only. It must never push, approve or merge. A person still decides.

