# When is a flag UI worth a server?

Choose when: the team wants a flag UI and an audit log, so a product manager can change a rollout and anyone can see who changed it and when. Unleash is the runner-up for that job.

Trade-off: it is one more server and one more database to run, patch and back up. A flag file in git already gives history, review and rollback. Our rollout has one flag and one editor, so the file is enough today.
