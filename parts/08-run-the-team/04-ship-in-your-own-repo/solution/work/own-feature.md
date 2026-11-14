# Own feature

## Repo

invoice-tool: a small web app that turns time sheets into invoices.

## Ticket

Show the due date on every invoice page.

## Acceptance

- AC-1: WHEN an invoice has a due date, THEN the invoice page shows it under the total.
- AC-2: WHEN an invoice has no due date, THEN the page shows "No due date" and does not crash.

## Evidence

- Commit: 3f9c2ab7d41e
- Test command: npm test
- Test result: 14 passed, 0 failed
- Review: the reviewer agent found one nit and no Important findings

## What I would change next time

Write the AC-2 test first, before the page. I wrote it after the code and it passed too easily.
