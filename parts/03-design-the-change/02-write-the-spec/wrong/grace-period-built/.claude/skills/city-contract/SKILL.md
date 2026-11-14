---

name: city-contract
description: Kestrel's service-level contract with Brannock City Transport. Use whenever you write a spec, plan, test or code for wrench reports, the GBFS feed or the crew queue.
---

# City contract (source: `data/contract/sla.yaml`)

Apply these rules to every spec, plan, test and change in this area.

1. **SLA-4: the 48 hour clock starts at the wrench.** Deadlines and queue order count from the rider's `reported_at`, never from when the repair job is opened (`opened_at`).
2. **SLA-4: a defect a crew finds itself gets 96 hours** (no wrench, so the clock starts when the crew finds it).
3. **SLA-12: the public feed is accurate at all times.** A wrenched bike must show `is_disabled: true` in the feed within 60 seconds. A grace period, delay or batch update that hides the defect longer breaks the contract.
4. **Each late wrenched bike costs a £50 credit** to the city (target: 95% repaired on time). Treat lateness bugs as money bugs.
5. **Never edit `data/contract/sla.yaml`.** Only the city changes it.
6. **If a request conflicts with the contract, do not build it.** Write the conflict down: which SLA, what the request asks, and why they clash. Then ask the product manager.
