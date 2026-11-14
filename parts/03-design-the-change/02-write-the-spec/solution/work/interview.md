# Interview

Q: Should a wrenched bike stay in the feed for a while, as operations asks?
A: No. The contract says the feed is accurate at all times, so the bike leaves at once. Write the grace period down as a concern.

Q: Which numbers must change when a bike is wrenched?
A: The bike flag, the station available count and the station disabled count, all within 60 seconds.

Q: In what order should crews see open jobs?
A: By deadline, the job due first on top. A wrench job is due 48 hours after it was reported.
