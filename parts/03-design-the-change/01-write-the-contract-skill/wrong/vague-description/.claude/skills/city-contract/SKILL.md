---

name: city-contract
description: Notes about data/contract/sla.yaml.
---

- **SLA-4 Bike defects:** A rider pressing the wrench button is notice of a defect. The clock starts when the rider reports the defect (the wrench). Limit: 48h if wrenched, 96h if not wrenched. Target 95%. Credit £50 per late bike.
- **SLA-9 Bike availability:** The share of the fleet that riders can rent, across every district. Minimum 96%.
- **SLA-11 Station outage:** No single station outage lasts longer than 4 hours.
- **SLA-12 Public feed accuracy:** Real-time data in the public feed is accurate and available to the public at all times. Feed max age 60 seconds.
