# Unattended usage budget

Read the supported weekly 10080-minute usage window. Remaining percentage is 100 minus used. Missing values do not establish eligibility. Begin at >=50% remaining and reset in >0 and <=24 hours, at most once per reset timestamp with durable atomic ownership.

Check before work, between checkpoints and before expensive batches. At <=35% remaining stop starting implementation and reserve headroom for validation and receipts. At <=25% preserve and stop. Unknown usage, reset rollover or a concrete blocker means preserve and pause. These are soft reserve thresholds, not guaranteed token costs.

A user may explicitly authorize a scoped manual exception. Keep account-specific timestamps and private budget receipts out of public Git history. No reset redemption, purchases, upgrades or automation changes follow from this policy. OPS-01 must prove scheduled access and duplicate protection before unattended coding is operational.
