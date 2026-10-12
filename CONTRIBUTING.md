# Contributing

Start with the README setup and `npm run check`. Open an issue describing the student-visible problem or discuss a bounded slice from docs/TASKS.md. Planned lessons are not automatically ready for implementation.

Keep changes focused. Explain the outcome, its real-life robotics connection and how it was tested. A lesson needs both languages, commented starter code, input ranges/units, reference and wrong programs, recovery behavior and a small transfer task. A green simulation result alone is not evidence of student understanding.

Account/runtime changes need authorization, isolation, concurrent-write and failure checks. Use synthetic aliases and disposable staging families. Do not run provider tests against production or deploy from a PR without explicit authorization. PR CI has no live service credentials.

Run `npm run check`, check both Vercel packages as documented, and inspect screenshots for UI changes. Generated output and private work files are ignored. Do not put access codes, environment files, personal email, browser sessions, student source or cloud receipts into commits, logs, screenshots or issues. Use a GitHub noreply commit email if you do not want your personal address in public history. `SECURITY.md` covers private reports.

By submitting a contribution, you agree that your original contribution is licensed under this repository's MIT license. Keep existing copyright and third-party notices. Do not import assets or code without a compatible license and clear provenance.
