# Email-only parent entry

The owner requested retirement of reusable parent access codes. Parents sign in with an email and short-lived email code. Students keep their private login codes, and anonymous Python practice remains available. This is a focused account transition; no mission or runtime behavior changes.

## Transition contract

- Remove code-only family signup and parent codes from the Student form. The server rejects parent codes on the ordinary code-login route, including old clients. Retired signup/recovery routes return guidance without creating an account, changing credentials or setting a session.
- An existing code-only family connects once using fresh email proof plus its existing parent code. A student code cannot connect email. A different already-verified email cannot be overwritten by a code. Existing verified recovery addresses can use ordinary email sign-in directly.
- Connecting keeps the same family, profile IDs, student codes, sessions, six mission/language drafts and challenge selections, experiment history and checked progress. It creates no new family or first-sign-in notice for existing students. The reusable parent code cannot subsequently sign in or reconnect the family under another challenge.
- A browser with an interrupted old setup can supply its existing random setup credential instead of a missing parent-code receipt. The server must find the matching pre-existing registration and active, unrotated parent; this path cannot create a new family or revive revoked credentials.
- An active legacy parent session can connect only that same profile, with a current profile header. A student or different parent session cannot be silently replaced by email authentication. Guest and student work retain the existing profile-save boundaries.
- A verified email connection request binds to one selected family. Competing connections cannot change an already-connected family. An index entry is written before the authoritative family transition so a failed index write cannot strand a committed email account. Stale index entries grant nothing until the authoritative family matches. Ordinary email sign-in still allows a parent to select among families belonging to that email.
- The same browser challenge can retry an interrupted connection during its existing ten-minute lifetime. UI retries finish the verified connection instead of repeating email verification after a session was set. Parent codes stay out of persistent client storage, URLs, receipts and logs.
- Old recovery links show a retirement notice and do not mutate authentication. Existing parent sessions remain valid. Mail unavailability preserves student access, active sessions and guest practice; it does not enable another parent-login method.

## Acceptance and evidence

`tests/parent-email.test.mjs` covers preserved records, wrong role/proof/family/email, races, interrupted writes, old setup credentials, expiry, retired HTTP routes, student-only code login and existing-session boundaries. The account UI suite covers email entry, one-time connection, missing responses, reload, six saved experiments on a fresh device, parent-only verified-email visibility and narrow layout. Existing onboarding/card/notification and real Java mission-progress checks remain in the suite.

Hosted runtime/authorization fixtures now pre-provision their disposable parent session rather than logging in with a retired parent code. They are not evidence of email delivery or parent authentication. Local inbox fixtures test application behavior only. A production release still needs an authorized real-inbox transition on protected staging, private-store acceptance, exact-head CI and public saved-progress checks. No existing production family is migrated by the build or by a bulk script.

FAMILY-03 is released through PR #5. [PROGRESS.md](PROGRESS.md) records exact-head CI, actual protected-staging inbox transitions, real Blob/Sandbox checks, production-candidate acceptance and public both-language saved-progress checks. No classroom pilot is claimed; that observation remains deferred.
