# Findings: why wrenched bikes miss the 48 hour limit

Claude Code read `data/wrenches.csv` and `data/repairs.csv`: 90 days, 2,160 wrench reports.

| Number                                                                | Value                                      | How it was found                                                                            |
| --------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Wrenched bikes fixed late (over 48 hours)                             | 118 of 2,160, which is 5.46%               | `bun -e` script: count jobs where `closed_at` minus `reported_at` is over 48 hours          |
| Contract target met                                                   | 94.54%, under the 95% target               | the same script, 100 minus the miss rate                                                    |
| Late bikes that are e-bikes with a BATT fault at North depot stations | 67 of 118, which is 56.8%                  | join `wrenches.csv` to `stations.csv` on `station_id`, filter `bike_type`, `fault`, `depot` |
| Wrenched bikes rented again before a crew reached them                | 193 of 2,160, which is 8.94%               | count rows with a value in `rented_again_at`                                                |
| Contract credits for late bikes                                       | 118 times 50 pounds, which is 5,900 pounds | late count times `credit_per_late_bike_gbp` in `data/contract/sla.yaml`                     |

## What this means

The misses are not spread out. More than half are battery faults on e-bikes near the North depot.
A battery fault does not look broken, so the next rider takes the bike. The feed still shows it as rentable.
The North crews work the oldest job first, not the job that is due first.

More crews would cost money every month. Taking the bike out of the feed and sorting the queue by deadline costs one change.
