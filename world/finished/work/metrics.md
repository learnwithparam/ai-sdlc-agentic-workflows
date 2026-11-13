# Lifecycle numbers for the spoke team

## The four DORA keys, from `data/deploys.csv` and `data/incidents.csv`

| Key                   | Value                            | Command                                                       |
| --------------------- | -------------------------------- | ------------------------------------------------------------- |
| Deploys               | 69 in 184 days, about 2.6 a week | `bun -e` count of rows in `deploys.csv`                       |
| Lead time for changes | median 66 hours                  | median of `deployed_at` minus `committed_at`                  |
| Change failure rate   | 9 of 69, which is 13%            | rows with an `incident_id`, divided by all rows               |
| Time to restore       | median 3.5 hours                 | median of `resolved_at` minus `started_at` in `incidents.csv` |

## This feature, from git

| Number                               | Value                                         | Command               |
| ------------------------------------ | --------------------------------------------- | --------------------- |
| Commits with the Claude Code trailer | see `git log --grep "Co-Authored-By: Claude"` | `git log --grep`      |
| Largest commit after the tests       | under 200 lines                               | `git log --shortstat` |

## What these numbers do not prove

DORA 2025 found AI adoption goes with more throughput and less stability. One feature is too small to show either. These numbers are our baseline, not a result.
