# Exclusive slice ownership

Before writing shared source, inspect active worktrees, branches/PRs and remote `refs/heads/ownership/*` refs. Reuse an existing slice branch. A manual job and scheduler must never share an active writer.

For an explicitly selected slice, claim a unique owner commit using `git push --force-with-lease=refs/heads/ownership/<slice>: origin <owner-commit>:refs/heads/ownership/<slice>`. The empty expected value requires the ref to be absent. Do not overwrite an existing claim or infer abandonment from age.

Record the owner, slice, base and claim SHA in the private operational receipt or appropriate PR. Release only the owner's exact lease after preserving tested work. A crashed owner requires explicit reconciliation. For scheduled runs OPS-01 must additionally prove atomic per-reset cycle ownership; this Git recipe alone is not end-to-end scheduler proof.
