# RoboLab · Signal Station

An open-source robotics workshop for teens. Edit real Python or Java and control an explorable 3D rescue searchlight. Learn what each motor, servo, sensor and line of code does through a useful mission.

**[Play RoboLab](https://robolab.vibecodingdad.com)**

[Student guide](PLAY.md) · [Curriculum](docs/CURRICULUM.md) · [MIT license](LICENSE)

<img width="1166" height="612" alt="image" src="https://github.com/user-attachments/assets/2c590ed5-bbc0-43aa-9aae-b962365d381a" />


## What works today

Three missions are live in real Python and Java: Mission 1 aims a rescue searchlight; Mission 2 uses a direction reading and an if/else decision to recover it from either side; Mission 3 repeats a move, stop and hold sequence to illuminate every ranger checkpoint. Each offers explained values and syntax, current-code predictions, free hints, changed-case challenges and recoverable drafts. Profile saves synchronize code and challenge; prediction/reflection notes stay on the device. The hosted version also provides parent email sign-in, individual student codes, experiment history, server-checked progress and shared family results.

Family play means separate attempts with shared results. All three server-checked Mission 1 challenges unlock checking in Mission 2; Mission 2's three checked challenges unlock checking in Mission 3. Practice is open in Missions 1–3; later lessons stay marked coming soon. The plan contains 16 core outlines and four optional extensions, including arms, rovers, light/color sensors and simplified flight. Badges record successful programs, not demonstrated understanding. Simultaneous co-control, official competition rankings and an AI coach are future work.

## Run locally

Use Node **22.18+** (24 recommended), npm and a running Docker engine for Java. Local play needs no cloud account or API key. Python runs in a separate-origin Pyodide worker; Java compiles and runs in a bounded, network-disabled container.

```sh
git clone https://github.com/willcheung/3d-robotics-hack.git
cd 3d-robotics-hack
npm ci
npm run setup:java
npm run build
npm run preview
```

Open **http://127.0.0.1:4173**. The same process serves the isolated Python runtime on port **4174**. Keep both ports free and use `127.0.0.1` consistently. Ctrl+C stops the preview. `npm run dev` provides live source updates. See [Java setup](docs/JAVA.md) for Docker/Colima details.

Local practice keeps drafts in this browser. Cross-device accounts, hosted Java and parent email sign-in require your own configured services; [self-hosting](docs/DEPLOYMENT.md) explains them. Copy `.env.example` only when configuring a hosted instance. Never commit credentials or student data.

## Check a change

```sh
npm ci
npm run setup:java
npx playwright install chromium
npm run check
```

The suite covers the model, account/recovery flows, browser UI, real sandboxed Java, real Python/WASM and builds. CI also packages the app and isolated runtime. Live storage, Sandbox and email tests require explicitly configured staging services and are separate from ordinary CI. See [validation](docs/VALIDATION.md).

## Contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). Build one complete, tested slice at a time. Preserve the [teaching and engineering contract](docs/FOUNDATION.md), honest curriculum availability and runtime isolation. Use [private vulnerability reporting](SECURITY.md) for security issues; never post access codes, family records or secrets in public issues.

RoboLab's original code, lesson documentation and procedural artwork use the **MIT license**. Dependencies retain their own licenses, including Pyodide (MPL-2.0), CPython (PSF), highlight.js (BSD-3-Clause) and OpenJDK (GPLv2 with Classpath Exception). See [THIRD-PARTY.md](THIRD-PARTY.md). No third-party robot models, photos, music or fonts are bundled.
