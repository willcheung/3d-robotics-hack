# Scheduled-run acceptance gate

Publishing this repository does not create or enable a scheduled job. Reuse an owner-authorized existing trigger; never create a duplicate implicitly.

OPS-01 must prove real scheduled access to supported weekly usage, the repository and toolchain, plus atomic cycle and slice ownership. Follow BUDGET.md. At most one coding run and one usage notification may be claimed for a reset timestamp. Resume unfinished slices first, require landed dependencies and stop after one validated slice.

Test overlapping polls, crashes before/after claiming, interrupted branches/PRs, missing access/usage, reset rollover, no-ready-slice behavior and conflicts with a manual writer. History alone is not a lock. Preserve exact resume receipts and use private configuration for account-specific scheduler identifiers. Scheduled jobs do not merge, deploy, purchase, enter credentials or change settings without explicit authorization.
