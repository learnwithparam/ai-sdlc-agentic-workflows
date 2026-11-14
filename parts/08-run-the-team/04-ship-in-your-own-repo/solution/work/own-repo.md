## Repo

pantry is a Bun CLI that lists the items in `items.json` and how many days are left until each one expires.

## Ticket

`bun pantry.ts` prints expired items with a negative day count (e.g. `yogurt: -2 days`), so people misread it and throw out good food.
The reporter says "3 of the 8 items in my list are already expired" and has no quick way to see only those.
The ask: show the word EXPIRED for expired items and add a way to list only expired items.

## Spec

- AC-1: WHEN the user runs `bun pantry.ts` and an item's `expires` date is before today THEN that line reads `<name>: EXPIRED` with no negative day count.
- AC-2: WHEN the user runs `bun pantry.ts` and an item's `expires` date is today or later THEN the line keeps `<name>: <n> days` (`0 days` for today) and does not contain `EXPIRED`.
- AC-3: WHEN the user runs `bun pantry.ts --expired` THEN it prints one `<name>: EXPIRED` line per expired item in `items.json` order, no lines for other items, and nothing with exit status 0 if none are expired.

## Proof

- Red: `bun test` on the P-1 commit (729c650) code, before any code change, printed `Ran 4 tests across 1 file. [19.00ms]` with `2 pass` / `2 fail` (AC-1 and AC-3 failed).
- Green: `bun test` now printed `Ran 4 tests across 1 file. [26.00ms]` with `4 pass` / `0 fail`.

## Commits

- 729c650 P-1: Add spec and acceptance tests for marking expired pantry items — 2 files changed, 107 insertions(+), 1 deletion(-)
- e496851 P-2: Show EXPIRED instead of a negative day count — 1 file changed, 4 insertions(+), 1 deletion(-)
- 0aeb41d P-3: Add --expired flag to list only expired items — 1 file changed, 7 insertions(+), 3 deletions(-)

## Review

The reviewer found one Important problem in P-2 and P-3: `daysLeft` compares the expiry date as UTC midnight with the current moment, not the local date the spec defines, so outside UTC an item expiring today can print `EXPIRED` (UTC−8, 20:00) or one that expired yesterday can print `0 days` (UTC+10, 08:00); they also flagged two nits, that the tests only use UTC midnight so they can't catch this, and that the `daysLeft(...) < 0` rule is written twice. I will fix the expiry check to compare local calendar dates through a single `isExpired` helper, and add tests that run at non-UTC times of day, before calling the feature done.
