# Third-party software and notices

RoboLab's original source, lesson documentation and procedural artwork are MIT-licensed; dependency licenses below continue to apply to their own code. The root MIT license does not relicense third-party software. No external robot models, photos, music or fonts are included.

| Component | Pinned version | License / source |
| --- | --- | --- |
| Three.js | 0.186.1 | MIT; https://github.com/mrdoob/three/tree/r186 |
| highlight.js | 11.12.0 | BSD-3-Clause; https://github.com/highlightjs/highlight.js |
| Pyodide | 314.0.7 | MPL-2.0; source at https://github.com/pyodide/pyodide/tree/314.0.7 |
| CPython in Pyodide | 3.14.2 | PSF and included historical/third-party terms; https://github.com/python/cpython/tree/v3.14.2 |
| @vercel/sandbox | 3.6.1 | Apache-2.0; installed npm package and its source metadata |
| @vercel/blob | 2.8.1 | Apache-2.0; installed npm package and its source metadata |
| @vercel/queue | 0.8.0 | Apache-2.0; installed npm package and its source metadata |
| iron-session | 9.0.1 | MIT; installed npm package and its source metadata |
| Vite / esbuild | 8.3.4 / 0.28.2 | MIT |
| TypeScript / Playwright | 5.9.3 / 1.64.0 | Apache-2.0 |

The lockfile records exact direct and transitive versions, integrity hashes and declared licenses. The publication review found only MIT, Apache-2.0, BSD-3-Clause, ISC and MPL-2.0 declarations in npm dependencies; retain their notices when redistributing their code.

The Pyodide JavaScript, WASM and standard library are copied unmodified from the pinned npm package. Their corresponding Pyodide source is linked above and remains under MPL-2.0; RoboLab does not modify those covered runtime files. `runtime/PYODIDE-LICENSE.txt` contains the MPL text. CPython's full license is in `licenses/CPYTHON-LICENSE.txt` and its complete incorporated-software notices are in `licenses/CPYTHON-NOTICES.rst`; highlight.js's full notice is in `licenses/HIGHLIGHTJS-LICENSE.txt`. Builds copy the project license, this source/attribution document and relevant full browser notices into both static outputs. Three.js's full notice comes from its pinned installed package.

Local Java uses the digest-pinned, unmodified Eclipse Temurin/OpenJDK 21 base in `java/Dockerfile`, under GPLv2 with Classpath Exception and bundled third-party notices. Upstream source/notices: https://github.com/adoptium/temurin21-binaries and https://openjdk.org/legal/gplv2+ce.html. Hosted setup installs the platform's OpenJDK, CPython and bubblewrap packages with their existing copyright/source records. No JDK binary is committed here or shipped in the browser package. If redistributing container images or modified runtimes, preserve their full notices and satisfy their corresponding-source requirements; the application MIT license does not replace those obligations.

The optional Vercel and Resend services have their own service terms. An open-source license grants no account, quota, infrastructure or credential access to the hosted demo.
