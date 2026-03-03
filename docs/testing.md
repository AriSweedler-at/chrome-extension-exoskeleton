# Testing

## Unit Tests (Vitest)

Unit and component tests run in jsdom via Vitest. They mock `chrome.*` APIs and test logic in isolation.

```bash
npm test              # watch mode
npm test -- --run     # single run
npm run test:ui       # browser UI
npm run test:coverage # with coverage report
```

Tests are colocated with source files (`X.test.tsx` next to `X.tsx`).

## End-to-End Tests (Playwright)

E2E tests load the built extension into a real Chromium browser and verify it works end-to-end: service worker registration, popup rendering, content script injection.

```bash
npm run test:e2e         # build + run headless
npm run test:e2e:headed  # build + run with visible browser
npm run test:e2e:ui      # build + Playwright UI mode
```

E2E tests live in `e2e/` and use a custom fixture (`e2e/fixtures.ts`) that:
1. Builds the extension to `dist/`
2. Launches Chromium with `--load-extension=dist`
3. Extracts the dynamic extension ID from the service worker URL
4. Provides `context` and `extensionId` to each test

Key constraints:
- **Chromium only** — extensions don't work in Firefox/WebKit
- **No toolbar interaction** — popup is tested by navigating to `chrome-extension://<id>/src/popup/index.html`
- **Sequential execution** — persistent context means 1 worker, no parallel isolation
