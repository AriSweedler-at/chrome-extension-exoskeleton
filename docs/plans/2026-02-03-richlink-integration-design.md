# Rich Link Integration Design

**Date:** 2026-02-03
**Status:** Approved

## Overview

Integrate chrome-extension-richlink as a tab in the exoskeleton, providing both a visual tab interface and keyboard shortcut (Cmd+Shift+C) to copy rich links from supported websites.

### Supported Sites
- Google Docs
- GitHub
- Atlassian (Confluence/Jira)
- Airtable
- Spinnaker
- Spacelift
- Universal fallback (any webpage)

## Architecture

### Handler Pattern (Additive)

**Core Concept:** Multiple handlers can match a URL. Each handler contributes one format.

- **Base handlers** (always present): Page Title, Raw URL
- **Specialized handlers** (conditionally added): GitHub, Google Docs, Atlassian, etc.
- Handlers self-register and define their own priority for ordering

### Handler System

**Base Classes** (`src/library/richlink/base.ts`):

```typescript
interface LinkFormat {
  label: string;        // Display name: "GitHub PR", "Page Title", "Raw URL"
  html: string;         // HTML to copy: "<a href='...'>text</a>"
  text: string;         // Plain text: "text (url)"
}

abstract class Handler {
  abstract canHandle(url: string): boolean;
  abstract getLabel(): string;
  abstract getHtml(): Promise<string>;
  abstract getText(): Promise<string>;
  abstract getPriority(): number;  // Lower = appears first

  async getFormat(): Promise<LinkFormat> {
    return {
      label: this.getLabel(),
      html: await this.getHtml(),
      text: await this.getText()
    };
  }

  isFallback(): boolean { return false; }
}
```

**Priority Guidelines:**
- Specialized handlers: 0-50 (GitHub: 10, Google Docs: 20, etc.)
- Page title handler: 100 (base, fallback)
- Raw URL handler: 200 (base, fallback)

**Handler Registry** (`src/library/richlink/handler-registry.ts`):

```typescript
export class HandlerRegistry {
  private static baseHandlers: Handler[] = [];
  private static specializedHandlers: Handler[] = [];

  static registerBase(handler: Handler): void {
    this.baseHandlers.push(handler);
    this.baseHandlers.sort((a, b) => a.getPriority() - b.getPriority());
  }

  static registerSpecialized(handler: Handler): void {
    this.specializedHandlers.push(handler);
    this.specializedHandlers.sort((a, b) => a.getPriority() - b.getPriority());
  }

  static getHandlersForUrl(url: string): Handler[] {
    const specialized = this.specializedHandlers.filter(h => h.canHandle(url));
    const combined = [...specialized, ...this.baseHandlers];
    return combined.sort((a, b) => a.getPriority() - b.getPriority());
  }

  static hasSpecializedHandler(url: string): boolean {
    return this.specializedHandlers.some(h => h.canHandle(url));
  }

  static async getAllFormats(url: string): Promise<LinkFormat[]> {
    const handlers = this.getHandlersForUrl(url);
    return await Promise.all(handlers.map(h => h.getFormat()));
  }
}
```

### Handlers to Implement

**Specialized Handlers** (`src/library/richlink/handlers/`):
- `github.handler.ts` - PR/issue titles (priority: 10)
- `google-docs.handler.ts` - Document title + current heading (priority: 20)
- `atlassian.handler.ts` - Confluence/Jira pages (priority: 30)
- `airtable.handler.ts` - Record titles (priority: 40)
- `spinnaker.handler.ts` - Application + pipeline names (priority: 50)
- `spacelift.handler.ts` - Stack information (priority: 60)

**Base Handlers:**
- `page-title.handler.ts` - Generic page title (priority: 100, fallback)
- `raw-url.handler.ts` - Just the URL (priority: 200, fallback)

**Registry** (`handlers/index.ts`):
- Exports all handlers
- Performs handler registration on module load

## Tab Component

**Tab Registration** (`src/tabs/richlink.tab.tsx`):

```typescript
import { TabRegistry } from '../library/tabs/tab-registry';
import { RichLinkComponent } from '../components/RichLinkComponent';
import { HandlerRegistry } from '../library/richlink/handlers';

TabRegistry.register({
  id: 'richlink',
  label: 'Rich Link',
  component: RichLinkComponent,
  enablementToggle: true,
  getPriority: (url: string) => {
    // Priority 0 if any specialized handler matches, 100 for fallback only
    return HandlerRegistry.hasSpecializedHandler(url) ? 0 : 100;
  },
});
```

**React Component** (`src/components/RichLinkComponent.tsx`):

Displays available link formats for the current page:
- Shows list of formats sorted by handler priority
- Each format shows: label, preview of link text, preview of URL
- Click format to copy to clipboard
- Uses `Clipboard.write()` and `Notifications.show()` utilities
- Loading state while extracting page info
- Error handling for unsupported pages (chrome://, etc.)

## Keyboard Command

**Manifest Update** (`manifest.json`):

```json
{
  "commands": {
    "copy-rich-link": {
      "suggested_key": {
        "default": "Ctrl+Shift+C",
        "mac": "Command+Shift+C"
      },
      "description": "Copy rich link to clipboard"
    }
  }
}
```

**Action Class** (`src/actions/copy-rich-link.action.ts`):

```typescript
import { Action } from '../library/action';
import { HandlerRegistry } from '../library/richlink/handlers';
import { Clipboard } from '../library/clipboard';
import { Notifications } from '../library/notifications';

interface CopyRichLinkPayload {
  url: string;
  cycleFormat?: boolean; // True for keyboard shortcut cycling
}

interface CopyRichLinkResult {
  success: boolean;
  formatIndex: number;
  totalFormats: number;
}

export class CopyRichLinkAction extends Action<CopyRichLinkPayload, CopyRichLinkResult> {
  type = 'COPY_RICH_LINK' as const;
}
```

**Content Script Handler** (`src/content/index.ts` update):

```typescript
CopyRichLinkAction.handle(async (payload) => {
  const formats = await HandlerRegistry.getAllFormats(payload.url);

  // Get format index (cycle if repeat press within 1s)
  const formatIndex = payload.cycleFormat
    ? getNextFormatIndex(formats.length)
    : 0;

  const format = formats[formatIndex];

  await Clipboard.write(format.text, format.html);

  // Show notification with format indicator
  const formatInfo = formats.length > 1 ? ` [${formatIndex + 1}/${formats.length}]` : '';
  Notifications.show(`Copied${formatInfo}\n${format.label}`);

  return { success: true, formatIndex, totalFormats: formats.length };
});
```

**Background Script** (`src/background/index.ts` update):

```typescript
Commands.onCommand(async (command) => {
  if (command === 'copy-rich-link') {
    const tab = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab[0]?.id && tab[0].url) {
      await CopyRichLinkAction.sendToTab(tab[0].id, {
        url: tab[0].url,
        cycleFormat: true
      });
    }
  }
});
```

## Data Flow

### Tab UI Flow
1. User opens tab on a page
2. `RichLinkComponent` mounts, gets current tab URL
3. Calls `HandlerRegistry.getAllFormats(url)`
4. Registry finds matching handlers (specialized + base), sorted by priority
5. Each handler extracts its format (label, html, text)
6. Component renders list of formats
7. User clicks a format → `Clipboard.write(text, html)` → `Notifications.show()`

### Keyboard Shortcut Flow
1. User presses Cmd+Shift+C
2. Background script receives command event
3. Sends `CopyRichLinkAction` to active tab's content script
4. Content script calls `HandlerRegistry.getAllFormats(url)`
5. Checks localStorage for recent copy (within 1s) → cycle to next format, else use first
6. Copies format to clipboard via `Clipboard.write()`
7. Shows notification with format indicator `[2/3]`
8. Caches format index + timestamp to localStorage

### Format Cycling (Keyboard Only)
- Uses localStorage key: `richlink-last-copy`
- Stores: `{ timestamp, formatIndex, url }`
- 1 second expiry window
- Tab UI does not cycle (always shows all formats)

### Copy Counter (Persistent)
- Uses localStorage key: `richlink-copy-count`
- Stores: `{ count: number }`
- Incremented on every successful copy (both tab UI and keyboard)
- Displayed in tab UI header (e.g., "Rich Link - 42 copied")
- Persists across sessions

## Testing Strategy

### Unit Tests (Vitest)

**Handler Tests** (`tests/library/richlink/handlers/*.test.ts`):
- Test `canHandle(url)` with various URLs
- Test `getLabel()` returns correct label
- Mock DOM elements, test `getHtml()` and `getText()` extraction
- Test `getPriority()` values
- Test `isFallback()` classification

**Registry Tests** (`tests/library/richlink/handler-registry.test.ts`):
- Test handler registration (base vs specialized)
- Test `getHandlersForUrl()` returns correct handlers in priority order
- Test `hasSpecializedHandler()` detection
- Test `getAllFormats()` combines formats
- Test priority sorting

**Action Tests** (`tests/actions/copy-rich-link.action.test.ts`):
- Test format cycling logic with localStorage
- Test format index calculation

**Component Tests** (`tests/components/RichLinkComponent.test.tsx`):
- Test loading state
- Test format rendering
- Test click-to-copy interaction
- Test error handling

## Implementation Order

1. Base classes (Handler, LinkFormat, HandlerRegistry)
2. Base handlers (page-title, raw-url) + tests
3. One specialized handler (GitHub) + tests - validate pattern
4. Remaining specialized handlers + tests
5. Action + keyboard command + tests
6. React component + tab registration + tests
7. Integration testing

## Migration Notes

- Original uses `WebpageInfo` class with multiple formats - new design has one format per handler
- Original uses localStorage for cycling - keep this pattern
- Original notification system - use exoskeleton's `Notifications.show()`
- Original clipboard API - use exoskeleton's `Clipboard.write()`
