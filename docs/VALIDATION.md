# Validation boundaries

The two-mission onboarding candidate has 126 local/CI checks: 11 model/lesson/preview, 39 account/recovery/onboarding, 12 account UI, 15 real Docker Java and 49 workshop browser tests. `npm run check` runs these after dependency, browser and Java-image setup. CI also builds both Vercel targets. [Onboarding QA](ONBOARDING-QA.md) distinguishes local, real-provider and remaining human evidence; the PR records the exact tested head.

Previous hosted acceptance exercised real Sandbox Java/Python, private Blob concurrent writes, family creation, cross-device drafts, checked progress, account isolation, Stop/recovery and actual verification/recovery emails using disposable families. Private provider credentials and operational receipts are not distributed with the source. A fork must repeat live provider acceptance against its own staging setup; passing local CI does not establish its deployment works.

The public-source candidate adds license/notice checks, secret scanning and documentation-link checks. Its release record names exactly which checks passed. Neither automated tests nor screenshots establish learning outcomes, actual student-device support or competition determinism for arbitrary source. Those gates remain explicit in FOUNDATION.md and CURRICULUM.md.
