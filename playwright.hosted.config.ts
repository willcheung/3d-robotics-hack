import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/hosted',workers:1,fullyParallel:false,timeout:90000,expect:{timeout:20000},reporter:'list',outputDir:'test-results-hosted',use:{baseURL:process.env.HOSTED_APP_ORIGIN||'http://127.0.0.1:4373',viewport:{width:1440,height:1050},trace:'off',screenshot:'off'}});
