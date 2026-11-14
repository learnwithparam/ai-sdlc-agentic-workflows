# Release notes: a reported bike leaves service at once

## Riders

- When you report a broken bike in the app, we take it out of service right away.
- No one else can rent that bike while it waits for repair.
- The station map now shows how many bikes are ready to ride and how many are broken at each station.
- You may see a few more broken bikes on the map. That means the map is telling the truth.
- Thank you for reporting broken bikes. Every report helps keep the next rider safe.

## Crews

- The queue now puts the job that is due first on top. Ties go to the earlier report, then the job id.
- The 48 hour clock for a rider report starts when the rider reports the bike, not when the job is opened.
- Defects a crew finds itself still get 96 hours, counted from when the crew found them.
- Jobs already open move to the same rule: their due times come up to 1 hour earlier. None is overdue because of this.
- A rider report now takes the bike out of service at once. There is no way yet to put it back in the app, so a fixed bike stays out until a follow-up change adds one.
