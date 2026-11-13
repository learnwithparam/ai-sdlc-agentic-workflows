---

name: city-contract
description: Kestrel's service-level contract with Brannock City Transport (SLA-4 bike defects/repair deadlines, SLA-9 bike availability, SLA-11 station outage, SLA-12 public feed accuracy). Use before changing or reviewing anything that touches wrench reports, the repair/crew queue, repair deadlines, bike disabling, the GBFS feed, or station status, and when analysing SLA compliance or credits.
---

# City contract: Brannock City Transport and Kestrel Bike Share

The source of truth is `data/contract/sla.yaml`. **Never edit that file**; only the city changes it. If this skill and the YAML ever disagree, the YAML wins. Re-read it before you rely on a number.

## Service levels

### SLA-4: Bike defects

- A rider pressing the wrench button (`POST /wrench`) **is notice of a defect**.
- **The clock starts when the rider reports the defect** (the wrench's `reported_at`), not when a repair job is opened (`opened_at`).
- Limits:
  - Wrenched by a rider: **48 hours** to repair.
  - Not wrenched (found by crew): **96 hours** to repair.
- Target: **95%** of bikes repaired within the limit.
- Penalty: **£50 credit per late bike**.

### SLA-9: Bike availability

- The share of the fleet riders can rent, across every district, must be at least **96%**.

### SLA-11: Station outage

- No single station outage may last longer than **4 hours**.

### SLA-12: Public feed accuracy

- Real-time data in the public GBFS feed must be accurate and available to the public at all times.
- Feed data may be at most **60 seconds** old (hence `ttl: 60` in `src/feed.ts`).

## What this means for the code

- **A wrench must disable the bike.** Once a rider reports a defect, the bike is not rentable; `bikes.is_disabled` must be set so the feed (and the map, which reuses `stationStatus`) stops showing it as available. Otherwise the feed is inaccurate (SLA-12).
- **Deadlines and queue order count from the wrench.** In `src/crew-queue.ts`, wrench-sourced jobs are due 48h after the wrench's `reported_at`; crew-found jobs are due 96h after they were found. Sort by the real deadline/report time, not by `opened_at`.
- Disabled bikes count against SLA-9 availability, so repairs (and re-enabling bikes when a job closes) matter for both SLA-4 and SLA-9.
- Don't raise the GBFS `ttl` above 60 seconds.
- When computing compliance or credits from `data/wrenches.csv` / `data/repairs.csv`, measure repair time from the wrench report, apply the 95% target, and charge £50 per bike that missed its limit.
