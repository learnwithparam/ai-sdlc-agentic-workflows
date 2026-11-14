# Where we miss the 48 hour repair limit (SLA-4)

Data: `data/wrenches.csv`, `data/repairs.csv`, `data/stations.csv` (2,160 wrenches, each with
exactly one repair job). Limit and credit come from `data/contract/sla.yaml`: 48 hours from the
wrench `reported_at`, target 95% on time, £50 credit per late bike.
Run from the `kestrel/` folder.

| #   | Number                                                                | Count                  | Percentage             | Command                                  |
| --- | --------------------------------------------------------------------- | ---------------------- | ---------------------- | ---------------------------------------- |
| 1   | Miss rate: wrenched bikes closed more than 48h after the wrench       | 118 of 2,160           | 5.5%                   | `bun work/misses.ts miss-rate`           |
| 2   | Late bikes that are e-bikes with a BATT fault at North-depot stations | 67 of 118              | 56.8%                  | `bun work/misses.ts north-ebike-battery` |
| 3   | Re-rent rate: wrenched bikes rented again before a crew reached them  | 193 of 2,160           | 8.9%                   | `bun work/misses.ts re-rent`             |
| 4   | Contract credits for late bikes                                       | 118 × £50 = **£5,900** | 5.5% of wrenched bikes | `bun work/misses.ts credits`             |

Supporting split (`bun work/misses.ts by-depot`):

| Group                  | Late        | Percentage |
| ---------------------- | ----------- | ---------- |
| North depot            | 81 of 816   | 9.9%       |
| South depot            | 37 of 1,344 | 2.8%       |
| North e-bike BATT jobs | 67 of 94    | 71.3%      |
| Every other job        | 51 of 2,066 | 2.5%       |

## What this means for the request for two more crews

- We are on time for 94.5% of wrenched bikes, just under the 95% target.
- The misses are concentrated, not spread out: one small group (94 North e-bike battery jobs,
  4% of all work) produces 57% of the late bikes, and 71% of that group is late.
- Everything else is on time 97.5% of the time, above target. South is at 2.8% late.
- So the gap looks like a North battery problem (spare batteries, charging, or e-bike skills
  at North), not a general shortage of crews. Two crews spread across both depots would
  mostly add capacity where we already meet the target.
- Fixing the North battery group alone would cut late bikes from 118 to at most 51 and
  credits from £5,900 to at most £2,550.
- Separately, 193 bikes (8.9%) were rented again after a wrench and before a crew reached them.
  That is a rider safety and feed accuracy (SLA-12) issue that more crews would not fix:
  a wrench does not currently disable the bike in `spoke`.
- These numbers show where the misses are, not why. Check with the North crews what slows
  battery jobs before deciding on staffing.
