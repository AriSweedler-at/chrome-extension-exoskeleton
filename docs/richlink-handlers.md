# Rich Link Handlers

Rich link handlers power the **Cmd+Shift+C** copy feature. Each handler knows how to produce a meaningful copy-paste link for a class of URLs (GitHub PRs, Airtable records, Google Docs, etc.).

## How it works

When the user copies a rich link, the system:

1. Finds all handlers whose `canHandle(url)` returns `true`
2. Collects their `getFormats()` results
3. Sorts by `priority` (lower = first)
4. Presents the format picker in the popup

Specialized handlers are tried first, then fallback handlers (Page Title, Raw URL) are always appended.

## Architecture

The system has three layers:

1. **`Handler`** (abstract base class in `base.ts`) — defines `canHandle(url)` and `getFormats(ctx)`
2. **`HandlerRegistry`** (in `handler-registry.ts`) — collects handlers into specialized vs. fallback lists, sorts and merges formats at query time
3. **Auto-discovery** (in `handlers/index.ts`) — `import.meta.glob('./*.handler.ts')` finds all handler files, instantiates any exported class that extends `Handler`, and registers it with `HandlerRegistry`

You never call `HandlerRegistry.register()` manually. Just export a class extending `Handler` from a `*.handler.ts` file and it's live.

## Adding a top-level handler

Create a `*.handler.ts` file in `src/exo-tabs/richlink/handlers/`. The class must extend `Handler` — that's how auto-discovery identifies it.

```ts
import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

export class MyHandler extends Handler {
    canHandle(url: URL): boolean {
        return url.hostname === 'example.com';
    }

    getFormats({url}: FormatContext): LinkFormat[] {
        const title = document.querySelector('h1')?.textContent?.trim() ?? 'Example';
        return [{
            label: 'Example Page',
            priority: 30,
            html: `<a href="${url}">${title}</a>`,
            text: `${title} (${url})`,
        }];
    }
}
```

Add a colocated `*.handler.test.ts` with tests.

### Key conventions

- **Priority:** Lower numbers appear first. Use 10-40 for specialized handlers, 100+ for fallbacks.
- **DOM access:** Handlers run in the content script context and have direct `document` access.
- **URL context:** Always use `ctx.url`, never `window.location` (handlers also run from the popup).
- **Fallback handlers:** Set `readonly isFallback = true` to mark a handler as a fallback (styled differently in UI).

## Airtable sub-handlers

`AirtableHandler` is a top-level handler for all `airtable.com` URLs. It delegates to **sub-handlers**, one per Airtable base, which are auto-discovered via `import.meta.glob`.

```
src/exo-tabs/richlink/handlers/airtable/airtable-handlers/
  base.ts                                        # AirtableSubHandler interface
  listable/listable.handler.ts                   # Listable (apptivTqaoebkrmV1)
  glossary/glossary.handler.ts                   # Airtable Glossary (appebZJp08MytrQhs)
  security-exception/security-exception.handler.ts  # Security Exceptions (appjBm1uPTsu1yTVU)
```

### Adding an Airtable sub-handler

1. Create `airtable-handlers/{name}/{name}.handler.ts`
2. Export an object implementing `AirtableSubHandler`
3. Create `airtable-handlers/{name}/{name}.handler.test.ts`

No other files need to change — the glob in `airtable.handler.ts` picks up `airtable-handlers/*/*.handler.ts` automatically.

```ts
import type {FormatContext, LinkFormat} from '@exo/exo-tabs/richlink/base';
import type {AirtableSubHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';

const MY_BASE_APP_ID = 'appXXXXXXXXXXXXXXX';

export const myBaseHandler: AirtableSubHandler = {
    canHandle(url: URL): boolean {
        return url.href.includes(MY_BASE_APP_ID);
    },

    getFormats({url}: FormatContext): LinkFormat[] {
        const title = document.querySelector(
            '[data-testid="cell-editor"][data-columntype="text"]',
        )?.textContent?.trim() ?? 'Record';

        return [{
            label: 'My Base',
            priority: 35,
            html: `<a href="${url}">${title}</a>`,
            text: `${title} (${url})`,
        }];
    },
};
```

### Common patterns

- **URL canonicalization:** Use `canonicalAirtableUrl()` from `url-utils.ts` to resolve `?detail=base64JSON` URLs into clean record permalinks.
- **Record ID extraction:** Parse from path segments (`/recXXX`) or query param values (`?key=recXXX`).
- **Title extraction:** Query `[data-testid="cell-editor"]` elements filtered by `data-columntype` (`text`, `formula`, `richText`, `date`, etc.).

### Shared utilities

| Module | Purpose |
|--------|---------|
| `url-utils.ts` | `canonicalAirtableUrl()` — resolves detail-panel URLs |
| `base.ts` | `AirtableSubHandler` interface |
| `@exo/exo-tabs/richlink/base` | `truncateWithEllipsis()`, `LinkFormat`, `FormatContext` |

## Testing handlers

See [testing.md](testing.md#rich-link-handler-tools) for the CLI tools (`parse-html`, `test-handler-html`) that help develop handlers with saved HTML files.
