import {defineConfig} from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    retries: 0,
    workers: 1, // extensions require persistent context — no parallel isolation
    reporter: 'list',
    projects: [{name: 'chromium'}],
});
