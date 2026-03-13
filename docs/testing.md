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

## Rich Link Handler Tools

Two CLI scripts help develop rich link handlers by loading saved HTML files into JSDOM.

### parse-html — DOM explorer

Dumps structured DOM info (cell-editors, text nodes, selectors) so you can figure out what to extract.

```bash
npm run parse-html <htmlFile>
```

### test-handler-html — handler verification

Tests a specific handler against an HTML file and shows the generated formats.

```bash
npm run test-handler-html <HandlerName> <htmlFile> [url]
```

Both resolve bare filenames from `handlers/examples/` and `handlers/{subdir}/examples/` directories. Drop an HTML file in the appropriate examples folder, then reference it by name.

```bash
npm run parse-html airtable-security-exception.html
npm run test-handler-html AirtableHandler airtable-security-exception.html "https://airtable.com/appXYZ/pagABC"
```

### Airtable sub-handlers

`AirtableHandler` delegates to per-base sub-handlers that are **auto-discovered** via `import.meta.glob`. Each sub-handler lives in its own directory under `src/exo-tabs/richlink/handlers/airtable/airtable-handlers/` and matches a single Airtable base by app ID.

```
src/exo-tabs/richlink/handlers/airtable/airtable-handlers/
  base.ts                              # AirtableSubHandler interface
  listable/listable.handler.ts         # Listable (apptivTqaoebkrmV1)
  glossary/glossary.handler.ts         # Airtable Glossary (appebZJp08MytrQhs)
  security-exception/security-exception.handler.ts  # Security Exceptions (appjBm1uPTsu1yTVU)
```

To add a new Airtable sub-handler:

1. Create `airtable-handlers/{name}/{name}.handler.ts` exporting an `AirtableSubHandler` object
2. Create `airtable-handlers/{name}/{name}.handler.test.ts` with colocated tests
3. Optionally save example HTML in `airtable/examples/` for the CLI tools

No imports or registration changes needed — the glob in `airtable.handler.ts` picks up any `*.handler.ts` file matching the `airtable-handlers/*/*.handler.ts` pattern.

A sub-handler implements two methods:

```ts
interface AirtableSubHandler {
    canHandle(url: URL): boolean;       // match by app ID
    getFormats(ctx: FormatContext): LinkFormat[];  // extract title from DOM, build link
}
```

Common patterns:
- **URL canonicalization:** Use `canonicalAirtableUrl()` from `url-utils.ts` to resolve `?detail=base64` URLs
- **Record ID extraction:** Parse from path (`/recXXX`) or query param values (`?key=recXXX`)
- **Title extraction:** Query `[data-testid="cell-editor"]` elements with the appropriate `data-columntype`
