# Parent email and student onboarding QA

FAMILY-02 is live on [RoboLab](https://robolab.vibecodingdad.com) from merged [PR #3](https://github.com/willcheung/3d-robotics-hack/pull/3), after explicit release authorization. Deployed source `12c56430732b9d0ee34dac4a799e1c2354b8841b` has the same tree as the tested PR head. PROGRESS.md links the passing post-merge CI and release evidence.

## What parents and students do

1. Open **Family & progress → Parent**, enter an email, and enter the six-digit emailed code in the same browser within ten minutes.
2. A new parent chooses **Create family**. A returning parent resumes the same family; multiple verified memberships show a chooser. The verified banner confirms the address.
3. Add student nicknames and create login cards. Copy a private link/code or print a card. One email contains the new batch of student logins. No student email, extra username or password is needed.
4. A student opens the link and chooses **Start learning**, or enters the code on the Student tab. The same code resumes that student's drafts, checked badges and mission unlocks on another device.
5. The parent receives one optional first-sign-in notice per new student. Further sign-ins and ordinary practice stay quiet. The dashboard shows who has started; parents can turn notices off.

Replacing a lost student code is explicit and keeps the student's work. A delayed email never prevents use of an issued student card. Email status distinguishes queued, retry, accepted and expired states; “sent” means provider acceptance, not guaranteed inbox placement.

## Evidence

- Ordinary acceptance: 11 model/lesson/preview checks, 39 account/recovery/onboarding checks, 12 account browser journeys, 15 isolated Java checks and 49 workshop browser behaviors. CI runs these and packages both Vercel targets. The final head's CI result, rather than this count alone, is the merge gate.
- Four separate real private Blob tests cover strong ETags, competing draft writes, signup/recovery races and concurrent email-onboarding family/batch/first-sign-in updates. Fixtures clean their own records and retain shared quotas. Their mail adapter is deliberately synthetic; they do not establish inbox delivery.
- Protected staging: actual parent signup and returning-parent email codes were received and used. The combined two-student setup email and one notice for each student's first sign-in were observed in the designated inbox. Repeat student sign-ins retained the same two notice event identities and provider receipts.
- Real hosted Python and Java each passed all three rescues in both missions, wrong-program rejection, error/Stop/Reset recovery, Mission 1 prerequisites, and fresh-device saved-draft/completion checks. Parent return restored both students and all six checked rescues per student. Sibling work stayed separate.
- After production promotion, the public custom domain passed the same signup, returning-parent and both-language journeys without a staging bypass. Five real QA emails were received: two parent codes, one combined setup email and two first-sign-in notices. Repeat logins kept the same notification identities and provider receipts. Live screenshots were inspected; only disposable test profiles were retired afterward, with their credentials/session confirmed invalid. Existing families, production session/storage secrets and shared quotas were preserved.
- Staging exposed and fixed custom queue packaging issues: explicit consumer registration and Node request/response helpers. Pending setup delivery was retried through the repaired worker, with stable Resend identity. First-sign-in delivery then ran automatically. Public worker invocation is denied; staging remains protected.
- Targeted regressions cover lost signup/batch responses, including the sixth-student limit; empty/control-character nicknames; stale profile switching; clipboard failure; masked/printable cards; expiry cleanup after queue failure; wrong/expired/browser-swapped codes; quotas; provider/queue outage; delivery replay and acceptance-before-receipt crashes.

Screenshots use synthetic identities and masked student credentials: [email code entry](images/onboarding-code-narrow.png), [verified parent](images/onboarding-parent-narrow.png), [student card](images/onboarding-card-narrow.png).

## Owner walkthrough

- [ ] On RoboLab, use Parent email sign-in. Check the email and enter its newest code in the browser that requested it.
- [ ] Create a family, add two nicknames, copy/print their cards, and verify that one setup email contains both logins. Check the layout on a phone-width screen.
- [ ] Open a card in a different browser. Confirm it asks the student to start, then lands in the lesson without parent settings.
- [ ] Edit, run and save Python; repeat in Java. Return with the same student code and verify the saved work and checked unlocks.
- [ ] Sign in as the second student and verify separate work. Expect one first-sign-in email per student, then no further login alerts.
- [ ] Sign out as parent, request a fresh email code and confirm the same family returns. Replace one student's code and verify the old code fails while their progress remains.
- [ ] Judge whether the labels and first-lesson path feel clear without coaching. Record time spent on setup separately from email waiting.

## Remaining limits

The roughly two-minute parent setup target is a design goal, not a completed human usability study. A parent/teen pilot and real student-device checks remain necessary. Hosted QA used disposable families on staging and production; it did not reset or migrate existing families. New email parents do not yet have an email-change management screen.

Vercel Queues remains a beta dependency. Each queued message is bound to a deployment; keep prior workers available during release/rollback. Cleanup can be delayed by a provider outage, while logical expiry still blocks use or delivery. Authentication cleanup has a short live deadline; the 23-hour card cleanup is covered by clock-controlled tests and authenticated scheduling, not a full-day wall-clock soak. Crash/outage cases are fault-injected locally rather than deliberately disrupting Resend. Forks must repeat the live provider checks with their own services.
