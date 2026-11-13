# Kestrel Bike Share: the spoke service

Kestrel runs the bike share for the city of Brannock: 180 stations and 2,100 bikes.
The `spoke` service keeps the public feed, takes wrench reports from the rider app, and lists repair jobs for the crews.

For example, when a rider presses the wrench button on bike `B-2207`, the app sends `POST /wrench`.

| Command                     | What it does                          |
| --------------------------- | ------------------------------------- |
| `bun run world`             | Starts spoke on http://localhost:4100 |
| `bun test`                  | Runs the tests                        |
| `bun run deploy:production` | Deploys spoke to production           |
| `bun run rollback`          | Rolls spoke back                      |

The contract with the city is in `data/contract/sla.yaml`.
