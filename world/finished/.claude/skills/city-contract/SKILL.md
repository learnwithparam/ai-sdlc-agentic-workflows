---

name: city-contract
description: Kestrel's contract with Brannock City Transport. Use it whenever you write a spec, a plan or code that touches wrench reports, the public feed or the crew queue.
---

# The city contract

The contract is in `data/contract/sla.yaml`. Read it. Never edit it.

- **The 48 hour clock starts at the wrench.** A wrenched bike must be fixed within 48 hours of the report, not 48 hours after the job is opened.
- **Defects a crew finds itself get 96 hours.** The clock starts when the crew reports it.
- **The public feed is accurate at all times.** A broken bike must show `is_disabled: true` within 60 seconds. A grace period breaks this rule.
- **Late bikes cost money.** Each late wrenched bike costs a credit of 50 pounds.

If a request conflicts with the contract, do not build it. Write the conflict down and ask the product manager.
