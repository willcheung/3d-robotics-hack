# Public progress

Implemented and previously validated: S01 rescue searchlight in Python, S02 real Java and syntax colors, DEPLOY-01 hosted runtimes and private family progress, FAMILY-01 in-app family/student setup, and RECOVERY-01 verified parent email recovery. Only Mission 1 is playable; its three rescue variations are one lesson. Later curriculum entries remain plans.

OPEN-01 prepares the public source distribution: privacy review, MIT license, dependency notices, generic setup/contribution/security documentation and publication guardrails. The publication receipt records its exact source and checks after validation. Private historical operations receipts are not part of the public source distribution.

For each future slice record ID/status, base SHA, branch/PR, last runnable and exact tested commit, checks/evidence, unmet criteria, blockers and next action. `review` means validated work awaiting acceptance; `done` means it landed. Resume unfinished authorized work before selecting another ready slice. Inspect live ownership before writing.

Actual student/device pilots and OPS-01 scheduled-access/atomic-cycle proof remain pending. No automation is activated by publishing the source.

## RECOVERY-02 — Visible email verification confirmation

- Status: done; [PR #1](https://github.com/willcheung/3d-robotics-hack/pull/1) merged and the tested app was promoted to [RoboLab](https://robolab.vibecodingdad.com) on October 12, 2026 after explicit release approval.
- Base: `451e93e68363fd76940c2efdd29ca3c1ac7233d3`; branch: `codex/email-verification-banner`.
- Last runnable implementation: `a8d807fefa7201c2258c4497492646b8027d7b84`; exact tested and deployed source: `6f6193bb15dc995b2a057f3d1af27f3f8d54c139`. Merge commit: `226d9b60a29850c30ee426329c3aed7697f77890`, preserving the newer README edits with identical application source.
- Outcome: a persistent, accessible “Email verified” banner identifies the server-confirmed parent recovery address and explains the recovery action. Pending or rejected links do not inherit a previous address's success; students and signed-out users see no address in the banner.
- Passed: 20 account/recovery tests, 7 browser account tests, TypeScript/production build and publication checks. Inspected [desktop](images/email-verified-desktop.png) and [narrow](images/email-verified-narrow.png) screenshots use synthetic identities. Browser checks cover new-tab confirmation, reopen/reload persistence, logout/student privacy, consumed-link failure and long-address wrapping.
- Exact-head CI passed: [88 workshop tests and deployment packages](https://github.com/willcheung/3d-robotics-hack/actions/runs/38276650048) and [publication safety](https://github.com/willcheung/3d-robotics-hack/actions/runs/38276650047).
- Protected staging, the production candidate and the public site passed the real verification-API banner checks: reload persistence, reused-link rejection, parent-only visibility and narrow layout. Live screenshots were inspected. The public browser journey passed parent/student sign-in, student creation, real Java, browser Python, server-checked Python and shared saved results; disposable fixtures were removed.
- Release limits: fresh-family signup checks were blocked by the existing daily quota, which was preserved; release checks used disposable pre-provisioned families. One staging Java Stop/restart failure did not recur in two focused reruns; its cause remains unconfirmed. This change has no backend, email-provider, storage or runtime changes, and does not claim new live email-delivery proof. Deployment IDs, package hashes and rollback details remain in the private operator receipt.
- Next action: no further work required for RECOVERY-02. Student/device pilots and later curriculum slices retain their existing readiness gates.
