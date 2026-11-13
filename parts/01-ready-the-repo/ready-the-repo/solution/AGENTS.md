# AGENTS.md

Rules every coding agent must follow in this repo.

- **Never edit `data/contract/sla.yaml`.** Only the city changes it. It is the source of truth for service levels (SLA-4 defect repair limits, SLA-9 availability, SLA-11 station outage, SLA-12 feed accuracy).
- **Never run `bun run deploy:production` or `bun run rollback` without a person approving first.** Here `scripts/deploy.ts` only appends to `logs/deploys.log`, but the team treats it as a real release.
- **Delete `spoke.db` to reseed** after changing the schema or the seed CSVs.
- **In tests, set `SPOKE_DB` and `SPOKE_LOG` to temp files before dynamically importing `src/database`.** The paths are read when the module loads.
- **No new dependencies.** The project uses only Bun built-ins (`bun:sqlite`, `Bun.serve`).
