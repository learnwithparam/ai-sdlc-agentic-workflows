# AGENTS.md

Rules every coding agent must follow in this repo.

- **Never edit `data/contract/sla.yaml`.** Only the city changes it. It holds the service levels: SLA-4 repair limits, SLA-9 bikes you can rent, SLA-11 station outage and SLA-12 feed accuracy.
- **Never run `bun run deploy:production` or `bun run rollback` until a person says yes.** Here `scripts/deploy.ts` only adds a line to `logs/deploys.log`. The team still treats it as a real release.
- **Delete `spoke.db` to load the data again** after you change the tables or the seed CSV files.
- **In tests, set `SPOKE_DB` and `SPOKE_LOG` to temp files first.** Then import `src/database`. It reads the paths when it loads.
- **No new packages.** The project uses only what Bun has built in (`bun:sqlite`, `Bun.serve`).
