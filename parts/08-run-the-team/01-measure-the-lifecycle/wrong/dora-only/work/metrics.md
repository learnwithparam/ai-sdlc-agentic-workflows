# DORA metrics for spoke

Sources: `data/deploys.csv` (69 deploys, D-001 to D-069) and `data/incidents.csv` (9 incidents, INC-01 to INC-09).
Period: first deploy 2026-05-04 to last deploy 2026-10-31, 180 days. All times are UTC.
The North double wrench incident (D-071, 2026-11-03) is in `data/incidents/north-double-wrench/` and `work/postmortem.md`, not in the CSV files. It is listed on its own at the end and is not counted in the tables below.

## Summary

| Metric                  | Value                               | How it was worked out                                             |
| ----------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| Deployment frequency    | 2.7 deploys a week (69 in 180 days) | count of rows in `deploys.csv` / (180 / 7)                        |
| Lead time for changes   | median 66 hours (about 2.75 days)   | `deployed_at` − `committed_at` for each deploy; median of 69      |
| Change failure rate     | 13% (9 of 69 deploys)               | deploys with an `incident_id` / all deploys                       |
| Time to restore service | median 3 h 31 min (mean 3 h 17 min) | `resolved_at` − `started_at` for each incident in `incidents.csv` |

Lead time range: 5.7 hours (D-009) to 118.6 hours (D-006). 11 deploys took under 30 hours, 30 took over 70 hours.
Restore range: 1 h 32 min (INC-07) to 4 h 16 min (INC-04).

## Deploys by month

| Month (by `deployed_at`) | Deploys | Deploys with an incident |
| ------------------------ | ------- | ------------------------ |
| May                      | 11      | 1 (D-009)                |
| June                     | 8       | 2 (D-013, D-019)         |
| July                     | 11      | 1 (D-023)                |
| August                   | 12      | 0                        |
| September                | 11      | 2 (D-050, D-053)         |
| October                  | 16      | 3 (D-054, D-062, D-063)  |
| Total                    | 69      | 9                        |

October had the most deploys and the most failed deploys. Its median lead time was 56.5 hours.

## Incidents

| Incident | Deploy | Time to restore | Summary                                 |
| -------- | ------ | --------------- | --------------------------------------- |
| INC-01   | D-009  | 3 h 54 min      | crew queue page timed out               |
| INC-02   | D-013  | 3 h 31 min      | e-bike battery levels missing from feed |
| INC-03   | D-019  | 2 h 25 min      | crew queue page timed out               |
| INC-04   | D-023  | 4 h 16 min      | feed served stale station counts        |
| INC-05   | D-050  | 3 h 45 min      | e-bike battery levels missing from feed |
| INC-06   | D-053  | 3 h 07 min      | e-bike battery levels missing from feed |
| INC-07   | D-054  | 1 h 32 min      | feed served stale station counts        |
| INC-08   | D-062  | 3 h 50 min      | crew queue page timed out               |
| INC-09   | D-063  | 3 h 12 min      | docks shown free while full             |

Three causes come back again and again: the crew queue timeout (3 times), missing e-bike battery levels (3 times) and stale station counts (2 times). That is 8 of the 9 incidents.

Not in the CSV: D-071 (2026-11-03), the North double wrench incident, restored in 3 h 10 min (07:40 to 10:50, `work/postmortem.md`).

## How much faster did Claude Code make the team?

This data cannot answer that, and no speed-up figure should be quoted from it.

- **Claude Code arrived at the end of the data.** The team added CLAUDE.md and the Claude Code settings on 2026-10-26 10:30 (commit `d16d783`). `deploys.csv` stops on 2026-10-31. Only 3 deploys come after that time (D-067 to D-069), and D-067 was committed at 08:43, before Claude Code was set up. That leaves 2 deploys (D-068: 21.2 h, D-069: 11.5 h), against 66 before.
- **Two deploys are too few.** Short lead times are not new: D-063 (22.9 h) and D-064 (14.2 h) came the week before, and 9 of the 66 earlier deploys were under 30 hours. Two short ones in a row fit the old pattern.
- **We cannot tell which changes Claude Code worked on.** The commits in `deploys.csv` are not in this repository, and nothing in the file marks a change as made with Claude Code. The work done with Claude Code in this repo (P-1 to P-3, A-1) does not appear in `deploys.csv`.
- **The one later deploy we know about failed.** D-071 shipped the Claude Code-built change to North and caused the double wrench incident. One deploy is not a change failure rate, but it does not support a claim of better delivery.

What would let us answer it:

1. Keep adding rows to `deploys.csv` and `incidents.csv` in the same format for at least a full quarter after 2026-10-26, including D-070 and D-071.
2. Add a column that says whether each change was made with Claude Code, so the two groups can be compared over the same period, not only before and after.
3. Compare the same four metrics, with medians and ranges, and look at whether change failure rate holds steady as lead time falls.
