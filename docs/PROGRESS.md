# Public progress

Implemented and previously validated: S01 rescue searchlight in Python, S02 real Java and syntax colors, DEPLOY-01 hosted runtimes and private family progress, FAMILY-01 in-app family/student setup, and RECOVERY-01 verified parent email recovery. Only Mission 1 is playable; its three rescue variations are one lesson. Later curriculum entries remain plans.

OPEN-01 prepares the public source distribution: privacy review, MIT license, dependency notices, generic setup/contribution/security documentation and publication guardrails. The publication receipt records its exact source and checks after validation. Private historical operations receipts are not part of the public source distribution.

For each future slice record ID/status, base SHA, branch/PR, last runnable and exact tested commit, checks/evidence, unmet criteria, blockers and next action. `review` means validated work awaiting acceptance; `done` means it landed. Resume unfinished authorized work before selecting another ready slice. Inspect live ownership before writing.

Actual student/device pilots and OPS-01 scheduled-access/atomic-cycle proof remain pending. No automation is activated by publishing the source.

## RECOVERY-02 — Visible email verification confirmation

- Status: validated locally; [PR #1](https://github.com/willcheung/3d-robotics-hack/pull/1) awaits full CI and release.
- Base: `451e93e68363fd76940c2efdd29ca3c1ac7233d3`; branch: `codex/email-verification-banner`.
- Last runnable and locally tested implementation: `a8d807fefa7201c2258c4497492646b8027d7b84`. The PR records checks for its final head, including this receipt.
- Outcome: a persistent, accessible “Email verified” banner identifies the server-confirmed parent recovery address and explains the recovery action. Pending or rejected links do not inherit a previous address's success; students and signed-out users see no address in the banner.
- Passed: 20 account/recovery tests, 7 browser account tests, TypeScript/production build and publication checks. Inspected [desktop](images/email-verified-desktop.png) and [narrow](images/email-verified-narrow.png) screenshots use synthetic identities. Browser checks cover new-tab confirmation, reopen/reload persistence, logout/student privacy, consumed-link failure and long-address wrapping.
- Next action: complete exact-head CI and the applicable release checks before promoting the app. This change has no backend, email-provider, storage or runtime changes; local inbox tests do not claim new live email-delivery proof.
