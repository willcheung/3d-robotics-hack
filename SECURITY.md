# Security

The supported version is the current `main` branch. Report a suspected vulnerability privately through [GitHub security advisories](https://github.com/willcheung/3d-robotics-hack/security/advisories/new). If that form is unavailable, open an issue asking for a private contact channel without including vulnerability details or private data.

Include a minimal reproduction, affected revision and expected versus actual behavior. Use a local checkout or an instance you own. Do not probe other families, extract private data, run destructive tests or send unbounded jobs to the shared demo. Never attach access codes, recovery links, cookies, API keys, private email or student programs to a public issue.

Python runs on a separate credential-free origin. Java compilation and execution are isolated with resource bounds. Family authorization and server-checked progress are enforced outside student code. These boundaries and their limits are described in docs/RUNTIME.md, docs/JAVA.md and docs/HOSTED.md. Source availability grants no access to the hosted service's accounts or infrastructure.

Rotate a credential if it is exposed; deleting a file or changing history alone does not revoke it. Keep server secrets outside VITE variables and student runtimes. Live provider tests use dedicated staging data and require operator authorization.
