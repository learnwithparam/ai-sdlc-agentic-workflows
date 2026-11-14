# DORA metrics: spoke, May–October 2026

Sources: `data/deploys.csv` (69 production deploys, D-001 to D-069, deployed 2026-05-04 to 2026-10-31) and `data/incidents.csv` (9 incidents, INC-01 to INC-09, each linked to one deploy). All times are UTC. I worked each figure out by hand from the CSVs, so treat them as accurate to about 0.1 h.

## Summary (whole period)

| Metric                  | Value                                                       | How it is measured                           |
| ----------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| Deployment frequency    | **69 deploys in 181 days, about 2.7 a week** (7–16 a month) | count of `deployed_at`                       |
| Lead time for changes   | **median 66 h (about 2.75 days)**, range 5.7 h to 118.6 h   | `deployed_at − committed_at` for each deploy |
| Change failure rate     | **9 / 69 = 13.0 %**                                         | deploys with an `incident_id`                |
| Time to restore service | **median 3.5 h**, range 1.5 h to 4.3 h                      | `resolved_at − started_at` for each incident |

## By month (month of `deployed_at`)

| Month | Deploys | Median lead time |          Failed deploys | Change failure rate | Restore time of incidents that started that month |
| ----- | ------: | ---------------: | ----------------------: | ------------------: | ------------------------------------------------- |
| May   |      11 |           75.4 h |               1 (D-009) |                 9 % | 3.9 h                                             |
| Jun   |       7 |           66.0 h |               1 (D-013) |                14 % | 3.5 h                                             |
| Jul   |      12 |           62.4 h |        2 (D-019, D-023) |                17 % | 2.4 h, 4.3 h                                      |
| Aug   |      12 |           77.5 h |                       0 |                 0 % | none                                              |
| Sep   |      11 |           62.2 h |        2 (D-050, D-053) |                18 % | 3.7 h, 3.1 h                                      |
| Oct   |      16 |           56.5 h | 3 (D-054, D-062, D-063) |                19 % | 1.5 h, 3.8 h, 3.2 h                               |

## What the trend shows

- **Throughput went up in October**: 16 deploys against 7–12 in earlier months, and the median lead time was the lowest of the period (56.5 h). Four of the six fastest deploys were in late October (D-064 14.2 h, D-068 21.2 h, D-069 11.5 h, D-063 23.0 h).
- **Stability did not get better.** The change failure rate rose from 9 % in May to 17–19 % from July onwards (August, at 0 %, is the exception). Five of the 9 incidents came after deploys from September onwards.
- **The same failures keep coming back**: "e-bike battery levels missing from feed" (INC-02, 05, 06), "crew queue page timed out" (INC-01, 03, 08) and "feed served stale station counts" (INC-04, 07). Feed failures count against SLA-12 (feed accuracy). These repeats are a better place to work than speed.
- **Restore time is steady** at about 3–4 h and is not trending in either direction.
- Lead time varies a lot within each month (often 15 h to 115 h). With 7–16 deploys a month, a change of 10–20 h in the monthly median is within normal noise.

## How much faster did Claude Code make the team?

**This data can't answer that, so this report gives no speed-up figure.**

- No record says when the team started using Claude Code. `deploys.csv` and `incidents.csv` don't record any tooling, and neither does anything else in `data/`.
- This repository's git history starts on 2026-11-13. That is two weeks after the last deploy in the data (D-069, 2026-10-31). The commits with Claude attribution all come after every deploy measured here, so none of these 69 deploys can be linked to Claude Code.
- Even with an adoption date, a before/after comparison would only show correlation. Team size, the mix of work and seasonal ridership also change over these months.

A defensible answer needs three things:

1. **An adoption date** (or a per-deploy flag) from the engineering manager.
2. **More deploys after that date.** November onwards needs at least 2–3 months, or about 30+ deploys, before medians at this level of noise mean anything.
3. **All four metrics, not just lead time.** On this data, any gain in speed in October came with a higher change failure rate.

Until then, the honest statement is: _"Over May–October, deploys sped up a little and became more frequent in October, while failures rose. We have no data yet that links either change to Claude Code."_
