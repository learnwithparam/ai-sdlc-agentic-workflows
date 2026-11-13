# Intent: a wrench takes the bike out of service

For sign-off by the product manager. This page says what should change, not how to build it.

## Problem

When a rider presses the wrench button to report a broken bike, `spoke` records the report and
opens a repair job, but the bike stays rentable. The public GBFS feed and the station map keep
showing it as available.

- Re-rent rate: **193 of 2,160** wrenched bikes (**8.9%**) were rented again before a crew
  reached them. Riders are being handed bikes another rider has already reported as broken.
  This is a rider safety problem, and it breaks feed accuracy (SLA-12). More crews would not
  fix it.
- Separately, **118 of 2,160** wrenched bikes (**5.5%**) were closed more than 48h after the
  wrench, costing **£5,900** in contract credits. The crew queue makes this worse: it counts
  each job's deadline from when the job was opened, not from the rider's report, which is when
  the SLA-4 clock starts. Crews can't see how close a job really is to being late.

## Proposed outcome

- As soon as a rider reports a bike, that bike shows as disabled, not available, in the public
  feed and on the map, and riders can no longer rent it.
- The bike stays out of service until a crew closes the repair job.
- In the crew queue, every wrench job's deadline and its place in the order count from the
  rider's report, matching SLA-4.
- Success measure: the re-rent rate falls from 8.9% to near zero. The feed's available and
  disabled counts match the real state of the fleet.

## Affected users and systems

- **Riders:** they stop being offered reported bikes. Stations show fewer bikes available to
  rent.
- **Crews (North and South depots):** queue deadlines and order may shift, because jobs now
  count from the rider's report.
- **Operations:** fleet availability figures will drop for as long as wrenched bikes wait for
  repair.
- **Brannock City Transport and third-party apps using the GBFS feed:** vehicle and station
  status will show reported bikes as disabled.
- **Systems:** the `spoke` wrench report (`POST /wrench`), the GBFS v3 vehicle and station status
  feeds, the station map, and the crew repair queue.

## Constraints

- `data/contract/sla.yaml` does not change. Only the city edits it. This change has to meet
  the contract as written:
  - SLA-4: the clock starts at the wrench, 48 hours for wrenched bikes, 95% target.
  - SLA-9: at least 96% of the fleet rentable.
  - SLA-12: the feed is accurate and no more than 60 seconds old.
- The feed stays fresh within the 60-second limit, and the 60s `ttl` does not change.
- No new packages. The service stays on what Bun has built in.
- Production deploy and rollback need a person's approval.

## Open questions

- Operations wants a 15 minute grace period before a wrenched bike leaves the feed. Should we
  allow it? A reported bike would still be rentable during that window. Is that acceptable
  for rider safety, and does it fit SLA-12's "accurate at all times"?
- If there is a grace period, what happens when the bike is rented during it? Does the rental
  go ahead, get blocked, or flag the bike for priority repair?
- Taking wrenched bikes out of service will lower fleet availability. Do we know how close
  this brings us to the SLA-9 minimum of 96%, especially at North, where repairs are slower?
- What should happen with false or duplicate wrench reports? Can a crew member put a bike
  back in service without a full repair job?
- Will moving queue deadlines to the rider's report make jobs already in the queue look late
  or overdue at launch? How should crews be told about this?
- Do the city or any third-party feed users need notice that disabled counts will rise?
- Is this change in scope alongside the North e-bike battery issue in the findings, or tracked
  separately?
