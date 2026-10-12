# Self-hosting RoboLab

The local workshop needs no cloud services. To host both languages and private family progress, use two separate HTTPS origins: an application with a Node 24 Vercel Function, and a public credential-free Python static runtime. Java and checked progress use isolated Vercel Sandboxes. Family data uses a private Vercel Blob store. Optional parent recovery uses a domain-verified Resend sender. These services may incur charges; obtain operator approval before provisioning or deploying.

## Local preview builds

Finish the app/runtime build before starting a preview, and use the same `APP_ORIGIN` and `VITE_RUNTIME_ORIGIN` for both commands. The ports belong to a pair; building for a different pair does not reconfigure a running server. The default pair is 4173/4174.

`npm run preview` takes a temporary snapshot of the app and Python files when it starts. Later builds can replace `dist` and `runtime-dist` without changing that running preview. Restart the preview intentionally to pick up a new build. Normal shutdown and failed startup remove the snapshot. `npm run dev` remains a live development server.

When fixing a reported run failure, test the owner's actual preview URL, verify their draft survives reload, and run the real language there. A passing test on a different port does not establish that the reported preview works. `tests/preview.test.mjs` reproduces replacement of both build directories, checks that an existing preview keeps its original assets, and checks startup/shutdown cleanup. It uses static HTTP fixtures; the browser tests establish real language execution.

## Server configuration

Create your own projects and dedicated staging/production stores. The app Function needs `APP_ORIGIN`, `SESSION_PASSWORD` (at least 32 random characters), `BLOB_READ_WRITE_TOKEN` and a tested `SANDBOX_SNAPSHOT_ID`. The hosted Sandbox SDK uses project-scoped Vercel OIDC. Optional `APP_ALTERNATE_ORIGIN` permits one additional exact app origin; `RECOVERY_ORIGIN` must be one of those app origins.

For email set server-only `RESEND_API_KEY` and `RECOVERY_EMAIL_FROM`, using a sending-only key scoped to your verified domain. Never copy secrets into `VITE_*`, the static runtime project, student VMs, screenshots or logs. Preserve session secrets and private stores across ordinary releases. `.env.example` lists variable names without credentials.

`scripts/setup-hosted-sandbox.mjs` creates a trusted base with OpenJDK, CPython and bubblewrap, then disables networking before taking a snapshot. It creates billed resources and is not run by ordinary CI. See HOSTED.md for limits and provider acceptance. Never put application credentials or student data into the snapshot.

## Reproducible packages

Use Node 24 and `npm ci`. Package each target in a separate clean directory because each command replaces `.vercel/output`:

```sh
VITE_HOSTED=1 VERCEL_TARGET=app APP_ORIGIN=https://app.example.test VITE_RUNTIME_ORIGIN=https://python.example.test npm run build:vercel
VERCEL_TARGET=runtime APP_ORIGIN=https://app.example.test VITE_RUNTIME_ORIGIN=https://python.example.test npm run build:vercel
```

Replace the example origins with your actual bare HTTPS origins, without trailing slashes, paths or credentials. Build both targets with the same optional `APP_ALTERNATE_ORIGIN`. The runtime must be distinct from every app origin. Never use wildcard CSP or postMessage origins. A random generated preview URL is not a substitute for the configured stable staging pair.

The app output must include `functions/api.func`; static files alone do not enable Java or family APIs. `scripts/check-vercel.mjs` verifies routing, streaming, required assets and notices. Both outputs include license files and source links for third-party runtimes. Link each output to the intended project and use `vercel deploy --prebuilt` only with deployment authorization. Do not expose build sources with `--public` or enable automatic production deployment as a side effect.

The Python runtime must be publicly readable and contain no credentials. Protect staging app deployments; send a test bypass header only to the exact app origin. Production family data and Java endpoints remain authenticated even when the app shell is public. A project's first deployment can be classified as production, so verify protection and data separation before any bootstrap.

## Acceptance and release

Require exact-head CI, real staging Sandbox and Blob checks, protected HTTPS browser acceptance and inspected synthetic screenshots. Exercise both languages, errors/Stop, worker/WASM assets, actual Function streaming/OIDC, secure cookies, family isolation, draft conflicts, revocation and checked rescue progress. A separate production candidate must use production settings with disposable fixtures before alias promotion. `tests/candidate-api.test.mjs` tests real streaming and checked Python; `tests/hosted/release.spec.ts` repeats the complete public browser journey after promotion.

Email recovery needs actual delivery and an explicit verification/reset journey, including expired/reused links and preserved student access. Do not treat the local test inbox as delivery proof. Clean only fixture records; retain shared quotas and unrelated families. Provider tests and screenshots do not replace a student/device pilot.

Record source SHA, deployment IDs, package hashes, test results and previous working deployments in a private operator receipt. Preserve a rollback artifact with compatible origins, storage and session configuration. Never reconnect staging data or rotate secrets as an incidental rollback. During a domain move, keep both exact app origins and promote the compatible Python runtime first; local cookies/drafts remain on their original host. Existing students can sign in at the new host to load server-saved work.

Parent recovery uses an opaque per-recovery epoch, so abandoned concurrent invitations remain invalid with earlier epoch-aware readers. Prefer a tested recovery-aware rollback. An older UI may hide email recovery while existing parent/student codes and records remain valid. Public source release does not authorize changes to a live deployment.
