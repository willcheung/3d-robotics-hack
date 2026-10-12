import {defineConfig} from '@playwright/test';
// Disposable account UI, with real local isolated Java progress checks.
// Cloud provider acceptance remains a separate hosted suite.
process.env.FAMILY_UI_MEMORY='1';
process.env.HOSTED_APP_ORIGIN='http://127.0.0.1:4473';
export default defineConfig({testDir:'./tests/hosted',testMatch:['setup.spec.ts','recovery-ui.spec.ts','mission-drafts.spec.ts'],workers:1,fullyParallel:false,timeout:30000,expect:{timeout:10000},reporter:'list',outputDir:'test-results-family-ui',use:{baseURL:process.env.HOSTED_APP_ORIGIN,viewport:{width:1440,height:1000},trace:'off',screenshot:'off'},webServer:{command:'VITE_HOSTED=1 VITE_RUNTIME_ORIGIN=http://127.0.0.1:4474 npx vite build --outDir work/family-ui-dist && node tests/helpers/family-ui-server.mjs',url:process.env.HOSTED_APP_ORIGIN,reuseExistingServer:false,timeout:30000}});
