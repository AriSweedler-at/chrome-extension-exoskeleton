# Rich Link Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate chrome-extension-richlink as a tab with keyboard shortcut support

**Architecture:** Handler-based system where each site has a handler that extracts link information. Handlers register themselves and contribute formats. Tab UI shows all formats, keyboard shortcut (Cmd+Shift+C) cycles through them.

**Tech Stack:** TypeScript, React, Vitest, Chrome Extensions API

---

## Task 1: Create base handler types and interfaces

**Files:**
- Create: `src/library/richlink/base.ts`
- Create: `src/library/richlink/handler-registry.ts`

**Step 1: Write failing tests for base types**

Create `tests/library/richlink/base.test.ts`:

```typescript
import {describe, it, expect} from 'vitest';
import {Handler, LinkFormat} from '../../../src/library/richlink/base';

class TestHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('test.com');
    }

    getLabel(): string {
        return 'Test Handler';
    }

    async getHtml(): Promise<string> {
        return '<a href="https://test.com">Test</a>';
    }

    async getText(): Promise<string> {
        return 'Test (https://test.com)';
    }

    getPriority(): number {
        return 10;
    }
}

describe('Handler', () => {
    it('getFormat should return LinkFormat', async () => {
        const handler = new TestHandler();
        const format = await handler.getFormat();

        expect(format).toEqual({
            label: 'Test Handler',
            html: '<a href="https://test.com">Test</a>',
            text: 'Test (https://test.com)',
        });
    });

    it('isFallback should default to false', () => {
        const handler = new TestHandler();
        expect(handler.isFallback()).toBe(false);
    });

    it('canHandle should check URL', () => {
        const handler = new TestHandler();
        expect(handler.canHandle('https://test.com/page')).toBe(true);
        expect(handler.canHandle('https://other.com/page')).toBe(false);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/library/richlink/base.test.ts`
Expected: FAIL - module not found

**Step 3: Implement base types**

Create `src/library/richlink/base.ts`:

```typescript
export interface LinkFormat {
    label: string; // Display name: "GitHub PR", "Page Title", "Raw URL"
    html: string; // HTML to copy: "<a href='...'>text</a>"
    text: string; // Plain text: "text (url)"
}

export abstract class Handler {
    abstract canHandle(url: string): boolean;
    abstract getLabel(): string;
    abstract getHtml(): Promise<string>;
    abstract getText(): Promise<string>;
    abstract getPriority(): number; // Lower = appears first

    async getFormat(): Promise<LinkFormat> {
        return {
            label: this.getLabel(),
            html: await this.getHtml(),
            text: await this.getText(),
        };
    }

    isFallback(): boolean {
        return false;
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/library/richlink/base.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/library/richlink/base.ts tests/library/richlink/base.test.ts
git commit -m "feat(richlink): add base Handler class and LinkFormat interface"
```

---

## Task 2: Create handler registry

**Files:**
- Create: `src/library/richlink/handler-registry.ts`
- Create: `tests/library/richlink/handler-registry.test.ts`

**Step 1: Write failing tests for handler registry**

Create `tests/library/richlink/handler-registry.test.ts`:

```typescript
import {describe, it, expect, beforeEach} from 'vitest';
import {HandlerRegistry} from '../../../src/library/richlink/handler-registry';
import {Handler} from '../../../src/library/richlink/base';

class SpecializedHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('github.com');
    }
    getLabel(): string {
        return 'GitHub';
    }
    async getHtml(): Promise<string> {
        return '<a href="url">GitHub</a>';
    }
    async getText(): Promise<string> {
        return 'GitHub (url)';
    }
    getPriority(): number {
        return 10;
    }
}

class FallbackHandler extends Handler {
    canHandle(_url: string): boolean {
        return true;
    }
    getLabel(): string {
        return 'Fallback';
    }
    async getHtml(): Promise<string> {
        return '<a href="url">Fallback</a>';
    }
    async getText(): Promise<string> {
        return 'Fallback (url)';
    }
    getPriority(): number {
        return 100;
    }
    isFallback(): boolean {
        return true;
    }
}

describe('HandlerRegistry', () => {
    beforeEach(() => {
        // Clear registry before each test
        HandlerRegistry['baseHandlers'] = [];
        HandlerRegistry['specializedHandlers'] = [];
    });

    it('should register specialized handlers', () => {
        const handler = new SpecializedHandler();
        HandlerRegistry.registerSpecialized(handler);

        const handlers = HandlerRegistry.getHandlersForUrl('https://github.com/repo');
        expect(handlers).toHaveLength(1);
        expect(handlers[0]).toBe(handler);
    });

    it('should register base handlers', () => {
        const handler = new FallbackHandler();
        HandlerRegistry.registerBase(handler);

        const handlers = HandlerRegistry.getHandlersForUrl('https://example.com');
        expect(handlers).toHaveLength(1);
        expect(handlers[0]).toBe(handler);
    });

    it('should return handlers in priority order', () => {
        const specialized = new SpecializedHandler();
        const fallback = new FallbackHandler();

        HandlerRegistry.registerSpecialized(specialized);
        HandlerRegistry.registerBase(fallback);

        const handlers = HandlerRegistry.getHandlersForUrl('https://github.com/repo');
        expect(handlers).toHaveLength(2);
        expect(handlers[0]).toBe(specialized); // Lower priority (10) comes first
        expect(handlers[1]).toBe(fallback);
    });

    it('should detect specialized handlers', () => {
        const specialized = new SpecializedHandler();
        const fallback = new FallbackHandler();

        HandlerRegistry.registerSpecialized(specialized);
        HandlerRegistry.registerBase(fallback);

        expect(HandlerRegistry.hasSpecializedHandler('https://github.com/repo')).toBe(true);
        expect(HandlerRegistry.hasSpecializedHandler('https://example.com')).toBe(false);
    });

    it('should get all formats from matching handlers', async () => {
        const specialized = new SpecializedHandler();
        const fallback = new FallbackHandler();

        HandlerRegistry.registerSpecialized(specialized);
        HandlerRegistry.registerBase(fallback);

        const formats = await HandlerRegistry.getAllFormats('https://github.com/repo');
        expect(formats).toHaveLength(2);
        expect(formats[0].label).toBe('GitHub');
        expect(formats[1].label).toBe('Fallback');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/library/richlink/handler-registry.test.ts`
Expected: FAIL - module not found

**Step 3: Implement handler registry**

Create `src/library/richlink/handler-registry.ts`:

```typescript
import {Handler, LinkFormat} from './base';

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
        const specialized = this.specializedHandlers.filter((h) => h.canHandle(url));
        const combined = [...specialized, ...this.baseHandlers];
        return combined.sort((a, b) => a.getPriority() - b.getPriority());
    }

    static hasSpecializedHandler(url: string): boolean {
        return this.specializedHandlers.some((h) => h.canHandle(url));
    }

    static async getAllFormats(url: string): Promise<LinkFormat[]> {
        const handlers = this.getHandlersForUrl(url);
        return await Promise.all(handlers.map((h) => h.getFormat()));
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/library/richlink/handler-registry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/library/richlink/handler-registry.ts tests/library/richlink/handler-registry.test.ts
git commit -m "feat(richlink): add handler registry with priority sorting"
```

---

## Task 3: Implement page title handler (base)

**Files:**
- Create: `src/library/richlink/handlers/page-title.handler.ts`
- Create: `tests/library/richlink/handlers/page-title.handler.test.ts`

**Step 1: Write failing tests for page title handler**

Create `tests/library/richlink/handlers/page-title.handler.test.ts`:

```typescript
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {PageTitleHandler} from '../../../../src/library/richlink/handlers/page-title.handler';

describe('PageTitleHandler', () => {
    let handler: PageTitleHandler;

    beforeEach(() => {
        handler = new PageTitleHandler();
        // Mock document
        vi.stubGlobal('document', {
            title: 'Test Page Title',
        });
        vi.stubGlobal('window', {
            location: {
                href: 'https://example.com/page',
            },
        });
    });

    it('should handle any URL', () => {
        expect(handler.canHandle('https://example.com')).toBe(true);
        expect(handler.canHandle('https://github.com')).toBe(true);
        expect(handler.canHandle('chrome://extensions')).toBe(true);
    });

    it('should be a fallback handler', () => {
        expect(handler.isFallback()).toBe(true);
    });

    it('should have priority 100', () => {
        expect(handler.getPriority()).toBe(100);
    });

    it('should return "Page Title" as label', () => {
        expect(handler.getLabel()).toBe('Page Title');
    });

    it('should extract page title from document', async () => {
        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://example.com/page">Test Page Title</a>');

        const text = await handler.getText();
        expect(text).toBe('Test Page Title (https://example.com/page)');
    });

    it('should handle missing title', async () => {
        vi.stubGlobal('document', {title: ''});

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://example.com/page">Untitled</a>');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/library/richlink/handlers/page-title.handler.test.ts`
Expected: FAIL - module not found

**Step 3: Implement page title handler**

Create `src/library/richlink/handlers/page-title.handler.ts`:

```typescript
import {Handler} from '../base';

export class PageTitleHandler extends Handler {
    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    getLabel(): string {
        return 'Page Title';
    }

    async getHtml(): Promise<string> {
        const title = document.title || 'Untitled';
        const url = window.location.href;
        return `<a href="${url}">${title}</a>`;
    }

    async getText(): Promise<string> {
        const title = document.title || 'Untitled';
        const url = window.location.href;
        return `${title} (${url})`;
    }

    getPriority(): number {
        return 100;
    }

    isFallback(): boolean {
        return true;
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/library/richlink/handlers/page-title.handler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/library/richlink/handlers/page-title.handler.ts tests/library/richlink/handlers/page-title.handler.test.ts
git commit -m "feat(richlink): add page title handler (fallback)"
```

---

## Task 4: Implement raw URL handler (base)

**Files:**
- Create: `src/library/richlink/handlers/raw-url.handler.ts`
- Create: `tests/library/richlink/handlers/raw-url.handler.test.ts`

**Step 1: Write failing tests for raw URL handler**

Create `tests/library/richlink/handlers/raw-url.handler.test.ts`:

```typescript
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {RawUrlHandler} from '../../../../src/library/richlink/handlers/raw-url.handler';

describe('RawUrlHandler', () => {
    let handler: RawUrlHandler;

    beforeEach(() => {
        handler = new RawUrlHandler();
        vi.stubGlobal('window', {
            location: {
                href: 'https://example.com/page?query=test#anchor',
            },
        });
    });

    it('should handle any URL', () => {
        expect(handler.canHandle('https://example.com')).toBe(true);
        expect(handler.canHandle('https://github.com')).toBe(true);
    });

    it('should be a fallback handler', () => {
        expect(handler.isFallback()).toBe(true);
    });

    it('should have priority 200', () => {
        expect(handler.getPriority()).toBe(200);
    });

    it('should return "Raw URL" as label', () => {
        expect(handler.getLabel()).toBe('Raw URL');
    });

    it('should return raw URL for both html and text', async () => {
        const html = await handler.getHtml();
        expect(html).toBe('https://example.com/page?query=test#anchor');

        const text = await handler.getText();
        expect(text).toBe('https://example.com/page?query=test#anchor');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/library/richlink/handlers/raw-url.handler.test.ts`
Expected: FAIL - module not found

**Step 3: Implement raw URL handler**

Create `src/library/richlink/handlers/raw-url.handler.ts`:

```typescript
import {Handler} from '../base';

export class RawUrlHandler extends Handler {
    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    getLabel(): string {
        return 'Raw URL';
    }

    async getHtml(): Promise<string> {
        return window.location.href;
    }

    async getText(): Promise<string> {
        return window.location.href;
    }

    getPriority(): number {
        return 200;
    }

    isFallback(): boolean {
        return true;
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/library/richlink/handlers/raw-url.handler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/library/richlink/handlers/raw-url.handler.ts tests/library/richlink/handlers/raw-url.handler.test.ts
git commit -m "feat(richlink): add raw URL handler (fallback)"
```

---

## Task 5: Implement GitHub handler (specialized)

**Files:**
- Create: `src/library/richlink/handlers/github.handler.ts`
- Create: `tests/library/richlink/handlers/github.handler.test.ts`

**Step 1: Write failing tests for GitHub handler**

Create `tests/library/richlink/handlers/github.handler.test.ts`:

```typescript
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {GitHubHandler} from '../../../../src/library/richlink/handlers/github.handler';

describe('GitHubHandler', () => {
    let handler: GitHubHandler;

    beforeEach(() => {
        handler = new GitHubHandler();
    });

    it('should handle GitHub URLs', () => {
        expect(handler.canHandle('https://github.com/user/repo')).toBe(true);
        expect(handler.canHandle('https://github.com/user/repo/pull/123')).toBe(true);
        expect(handler.canHandle('https://example.com')).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback()).toBe(false);
    });

    it('should have priority 10', () => {
        expect(handler.getPriority()).toBe(10);
    });

    it('should return "GitHub PR" as label', () => {
        expect(handler.getLabel()).toBe('GitHub PR');
    });

    it('should extract PR title from GitHub page', async () => {
        // Mock GitHub PR page DOM
        const mockTitle = document.createElement('span');
        mockTitle.className = 'js-issue-title';
        mockTitle.textContent = 'Fix bug in authentication';
        document.body.appendChild(mockTitle);

        vi.stubGlobal('window', {
            location: {
                href: 'https://github.com/user/repo/pull/123',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://github.com/user/repo/pull/123">Fix bug in authentication</a>');

        const text = await handler.getText();
        expect(text).toBe('Fix bug in authentication (https://github.com/user/repo/pull/123)');

        document.body.removeChild(mockTitle);
    });

    it('should handle missing PR title', async () => {
        vi.stubGlobal('window', {
            location: {
                href: 'https://github.com/user/repo',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://github.com/user/repo">GitHub Page</a>');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/library/richlink/handlers/github.handler.test.ts`
Expected: FAIL - module not found

**Step 3: Implement GitHub handler**

Create `src/library/richlink/handlers/github.handler.ts`:

```typescript
import {Handler} from '../base';

export class GitHubHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('github.com');
    }

    getLabel(): string {
        return 'GitHub PR';
    }

    async getHtml(): Promise<string> {
        const title = this.extractLinkText();
        const url = window.location.href;
        return `<a href="${url}">${title}</a>`;
    }

    async getText(): Promise<string> {
        const title = this.extractLinkText();
        const url = window.location.href;
        return `${title} (${url})`;
    }

    getPriority(): number {
        return 10;
    }

    private extractLinkText(): string {
        const titleElement = document.querySelector('.js-issue-title');
        if (titleElement?.textContent) {
            return titleElement.textContent.trim();
        }
        return 'GitHub Page';
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/library/richlink/handlers/github.handler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/library/richlink/handlers/github.handler.ts tests/library/richlink/handlers/github.handler.test.ts
git commit -m "feat(richlink): add GitHub handler for PRs and issues"
```

---

## Task 6: Implement remaining specialized handlers

**Note:** Following the same TDD pattern as GitHub handler, implement these handlers in sequence:

**6.1: Google Docs Handler**
- File: `src/library/richlink/handlers/google-docs.handler.ts`
- Test: `tests/library/richlink/handlers/google-docs.handler.test.ts`
- Priority: 20
- Label: "Google Doc"
- Selector: `.document-title` or similar
- Commit: `feat(richlink): add Google Docs handler`

**6.2: Atlassian Handler**
- File: `src/library/richlink/handlers/atlassian.handler.ts`
- Test: `tests/library/richlink/handlers/atlassian.handler.test.ts`
- Priority: 30
- Label: "Confluence Page" or "Jira Issue"
- URL check: `atlassian.net`
- Commit: `feat(richlink): add Atlassian handler for Confluence and Jira`

**6.3: Airtable Handler**
- File: `src/library/richlink/handlers/airtable.handler.ts`
- Test: `tests/library/richlink/handlers/airtable.handler.test.ts`
- Priority: 40
- Label: "Airtable Record"
- URL check: `airtable.com`
- Commit: `feat(richlink): add Airtable handler`

**6.4: Spinnaker Handler**
- File: `src/library/richlink/handlers/spinnaker.handler.ts`
- Test: `tests/library/richlink/handlers/spinnaker.handler.test.ts`
- Priority: 50
- Label: "Spinnaker Pipeline"
- URL check: `spinnaker`
- Commit: `feat(richlink): add Spinnaker handler`

**6.5: Spacelift Handler**
- File: `src/library/richlink/handlers/spacelift.handler.ts`
- Test: `tests/library/richlink/handlers/spacelift.handler.test.ts`
- Priority: 60
- Label: "Spacelift Stack"
- URL check: `spacelift`
- Commit: `feat(richlink): add Spacelift handler`

---

## Task 7: Create handler index and auto-registration

**Files:**
- Create: `src/library/richlink/handlers/index.ts`

**Step 1: Create handler index file**

Create `src/library/richlink/handlers/index.ts`:

```typescript
import {HandlerRegistry} from '../handler-registry';
import {PageTitleHandler} from './page-title.handler';
import {RawUrlHandler} from './raw-url.handler';
import {GitHubHandler} from './github.handler';
import {GoogleDocsHandler} from './google-docs.handler';
import {AtlassianHandler} from './atlassian.handler';
import {AirtableHandler} from './airtable.handler';
import {SpinnakerHandler} from './spinnaker.handler';
import {SpaceliftHandler} from './spacelift.handler';

// Export everything
export {HandlerRegistry} from '../handler-registry';
export * from '../base';
export * from './page-title.handler';
export * from './raw-url.handler';
export * from './github.handler';
export * from './google-docs.handler';
export * from './atlassian.handler';
export * from './airtable.handler';
export * from './spinnaker.handler';
export * from './spacelift.handler';

// Auto-register handlers on module load
HandlerRegistry.registerSpecialized(new GitHubHandler());
HandlerRegistry.registerSpecialized(new GoogleDocsHandler());
HandlerRegistry.registerSpecialized(new AtlassianHandler());
HandlerRegistry.registerSpecialized(new AirtableHandler());
HandlerRegistry.registerSpecialized(new SpinnakerHandler());
HandlerRegistry.registerSpecialized(new SpaceliftHandler());

HandlerRegistry.registerBase(new PageTitleHandler());
HandlerRegistry.registerBase(new RawUrlHandler());
```

**Step 2: Verify handlers auto-register**

Run: `npm test tests/library/richlink/handler-registry.test.ts`
Expected: PASS (handlers should be available after import)

**Step 3: Commit**

```bash
git add src/library/richlink/handlers/index.ts
git commit -m "feat(richlink): add handler index with auto-registration"
```

---

## Task 8: Create copy counter utility

**Files:**
- Create: `src/library/richlink/copy-counter.ts`
- Create: `tests/library/richlink/copy-counter.test.ts`

**Step 1: Write failing tests for copy counter**

Create `tests/library/richlink/copy-counter.test.ts`:

```typescript
import {describe, it, expect, beforeEach} from 'vitest';
import {CopyCounter} from '../../../src/library/richlink/copy-counter';

describe('CopyCounter', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should start at 0', async () => {
        const count = await CopyCounter.getCount();
        expect(count).toBe(0);
    });

    it('should increment count', async () => {
        await CopyCounter.increment();
        const count = await CopyCounter.getCount();
        expect(count).toBe(1);

        await CopyCounter.increment();
        const count2 = await CopyCounter.getCount();
        expect(count2).toBe(2);
    });

    it('should persist across instances', async () => {
        await CopyCounter.increment();
        await CopyCounter.increment();

        const count = await CopyCounter.getCount();
        expect(count).toBe(2);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/library/richlink/copy-counter.test.ts`
Expected: FAIL - module not found

**Step 3: Implement copy counter**

Create `src/library/richlink/copy-counter.ts`:

```typescript
const STORAGE_KEY = 'richlink-copy-count';

export class CopyCounter {
    static async getCount(): Promise<number> {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return 0;
        }
        try {
            const data = JSON.parse(stored);
            return data.count || 0;
        } catch {
            return 0;
        }
    }

    static async increment(): Promise<number> {
        const count = await this.getCount();
        const newCount = count + 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({count: newCount}));
        return newCount;
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/library/richlink/copy-counter.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/library/richlink/copy-counter.ts tests/library/richlink/copy-counter.test.ts
git commit -m "feat(richlink): add copy counter utility with localStorage"
```

---

## Task 9: Create CopyRichLinkAction

**Files:**
- Create: `src/actions/copy-rich-link.action.tsx`
- Create: `tests/actions/copy-rich-link.action.test.tsx`

**Step 1: Write failing tests for action**

Create `tests/actions/copy-rich-link.action.test.tsx`:

```typescript
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {CopyRichLinkAction} from '../../src/actions/copy-rich-link.action';

describe('CopyRichLinkAction', () => {
    it('should have correct type', () => {
        const action = new CopyRichLinkAction();
        expect(action.type).toBe('COPY_RICH_LINK');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/actions/copy-rich-link.action.test.tsx`
Expected: FAIL - module not found

**Step 3: Implement action class**

Create `src/actions/copy-rich-link.action.tsx`:

```typescript
import {Action} from '@library/actions/base-action';

export interface CopyRichLinkPayload {
    url: string;
    formatIndex?: number; // Specific format to copy (optional)
}

export interface CopyRichLinkResult {
    success: boolean;
    formatIndex: number;
    totalFormats: number;
}

export class CopyRichLinkAction extends Action<CopyRichLinkPayload, CopyRichLinkResult> {
    type = 'COPY_RICH_LINK' as const;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/actions/copy-rich-link.action.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/actions/copy-rich-link.action.tsx tests/actions/copy-rich-link.action.test.tsx
git commit -m "feat(richlink): add CopyRichLinkAction"
```

---

## Task 10: Register action handler in content script

**Files:**
- Modify: `src/content/index.tsx`

**Step 1: Import dependencies**

Add to top of `src/content/index.tsx`:

```typescript
import {CopyRichLinkAction} from '../actions/copy-rich-link.action';
import {HandlerRegistry} from '../library/richlink/handlers';
import {Clipboard} from '../library/clipboard';
import {Notifications} from '../library/notifications';
import {CopyCounter} from '../library/richlink/copy-counter';
```

**Step 2: Add format cycling helper**

Add helper function to `src/content/index.tsx`:

```typescript
// Format cycling for keyboard shortcut
function getNextFormatIndex(totalFormats: number): number {
    const CACHE_KEY = 'richlink-last-copy';
    const CACHE_EXPIRY_MS = 1000;

    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) {
            return 0;
        }

        const data = JSON.parse(cached);
        const isExpired = Date.now() - data.timestamp > CACHE_EXPIRY_MS;

        if (isExpired) {
            localStorage.removeItem(CACHE_KEY);
            return 0;
        }

        // Cycle to next format
        const nextIndex = (data.formatIndex + 1) % totalFormats;
        return nextIndex;
    } catch {
        return 0;
    }
}

function cacheFormatIndex(formatIndex: number): void {
    const CACHE_KEY = 'richlink-last-copy';
    const data = {
        timestamp: Date.now(),
        formatIndex,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}
```

**Step 3: Register action handler**

Add action handler to `src/content/index.tsx`:

```typescript
// Register CopyRichLinkAction handler
CopyRichLinkAction.handle(async (payload) => {
    const formats = await HandlerRegistry.getAllFormats(payload.url);

    // Get format index
    const formatIndex = payload.formatIndex !== undefined
        ? payload.formatIndex
        : getNextFormatIndex(formats.length);

    const format = formats[formatIndex];

    // Copy to clipboard
    await Clipboard.write(format.text, format.html);

    // Increment counter
    const newCount = await CopyCounter.increment();

    // Show notification with format indicator
    const formatInfo = formats.length > 1 ? ` [${formatIndex + 1}/${formats.length}]` : '';
    Notifications.show(`Copied${formatInfo}\n${format.label}\nTotal: ${newCount}`);

    // Cache format index for cycling
    if (payload.formatIndex === undefined) {
        cacheFormatIndex(formatIndex);
    }

    return {success: true, formatIndex, totalFormats: formats.length};
});
```

**Step 4: Test manually**

Build: `npm run dev`
Test: Open extension, check console for errors

**Step 5: Commit**

```bash
git add src/content/index.tsx
git commit -m "feat(richlink): register CopyRichLinkAction handler in content script"
```

---

## Task 11: Add keyboard command in background script

**Files:**
- Modify: `src/background/index.tsx`
- Modify: `manifest.json`

**Step 1: Update manifest.json**

Add command to `manifest.json` in the `"commands"` section:

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

**Step 2: Add command handler to background script**

In `src/background/index.tsx`, add import:

```typescript
import {CopyRichLinkAction} from '../actions/copy-rich-link.action';
```

Add handler in the `Commands.onCommand` callback:

```typescript
Commands.onCommand(async (command) => {
    console.log('Command received:', command);

    // ... existing handlers ...

    if (command === 'copy-rich-link') {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

        if (tab.id && tab.url) {
            try {
                await CopyRichLinkAction.sendToTab(tab.id, {url: tab.url});
                console.log('Rich link copied via keyboard shortcut');
            } catch (error) {
                console.error('Failed to copy rich link:', error);
            }
        }
    }
});
```

**Step 3: Test manually**

Build: `npm run dev`
Test: Press Cmd+Shift+C on a GitHub page, verify link copied

**Step 4: Commit**

```bash
git add src/background/index.tsx manifest.json
git commit -m "feat(richlink): add keyboard command (Cmd+Shift+C) for copying rich links"
```

---

## Task 12: Create Rich Link React component

**Files:**
- Create: `src/components/RichLinkComponent.tsx`
- Create: `tests/components/RichLinkComponent.test.tsx`

**Step 1: Write failing tests for component**

Create `tests/components/RichLinkComponent.test.tsx`:

```typescript
import {describe, it, expect, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {RichLinkComponent} from '../../src/components/RichLinkComponent';

describe('RichLinkComponent', () => {
    it('should render loading state initially', () => {
        render(<RichLinkComponent />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render formats after loading', async () => {
        // Mock chrome.tabs.query
        vi.stubGlobal('chrome', {
            tabs: {
                query: vi.fn().mockResolvedValue([{url: 'https://github.com/user/repo'}]),
            },
        });

        render(<RichLinkComponent />);

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/components/RichLinkComponent.test.tsx`
Expected: FAIL - module not found

**Step 3: Implement component**

Create `src/components/RichLinkComponent.tsx`:

```typescript
import React, {useState, useEffect} from 'react';
import {HandlerRegistry} from '../library/richlink/handlers';
import {LinkFormat} from '../library/richlink/base';
import {CopyRichLinkAction} from '../actions/copy-rich-link.action';
import {CopyCounter} from '../library/richlink/copy-counter';

export const RichLinkComponent: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formats, setFormats] = useState<LinkFormat[]>([]);
    const [copyCount, setCopyCount] = useState(0);
    const [currentUrl, setCurrentUrl] = useState<string>('');

    useEffect(() => {
        loadFormats();
        loadCopyCount();
    }, []);

    async function loadFormats() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tab.url) {
                throw new Error('No active tab URL');
            }

            // Check for chrome:// pages
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot copy links from chrome:// pages');
            }

            setCurrentUrl(tab.url);
            const formats = await HandlerRegistry.getAllFormats(tab.url);
            setFormats(formats);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load formats');
            setLoading(false);
        }
    }

    async function loadCopyCount() {
        const count = await CopyCounter.getCount();
        setCopyCount(count);
    }

    async function handleCopyFormat(formatIndex: number) {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tab.id) {
                throw new Error('No active tab');
            }

            await CopyRichLinkAction.sendToTab(tab.id, {
                url: currentUrl,
                formatIndex,
            });

            // Reload copy count
            await loadCopyCount();
        } catch (err) {
            console.error('Failed to copy format:', err);
        }
    }

    if (loading) {
        return <div style={{padding: '16px'}}>Loading formats...</div>;
    }

    if (error) {
        return <div style={{padding: '16px', color: 'red'}}>{error}</div>;
    }

    return (
        <div style={{padding: '16px'}}>
            <div style={{marginBottom: '12px', fontSize: '14px', color: '#666'}}>
                Total copied: {copyCount}
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {formats.map((format, index) => (
                    <button
                        key={index}
                        onClick={() => handleCopyFormat(index)}
                        style={{
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        <div style={{fontWeight: 'bold', marginBottom: '4px'}}>{format.label}</div>
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#666',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {format.text.length > 60
                                ? format.text.substring(0, 60) + '...'
                                : format.text}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/components/RichLinkComponent.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/RichLinkComponent.tsx tests/components/RichLinkComponent.test.tsx
git commit -m "feat(richlink): add RichLinkComponent with format list and copy counter"
```

---

## Task 13: Register Rich Link tab

**Files:**
- Create: `src/tabs/richlink.tab.tsx`
- Modify: `src/tabs/index.tsx`

**Step 1: Create tab registration**

Create `src/tabs/richlink.tab.tsx`:

```typescript
import {TabRegistry} from '../library/tabs/tab-registry';
import {RichLinkComponent} from '../components/RichLinkComponent';
import {HandlerRegistry} from '../library/richlink/handlers';

// Must import handlers to trigger auto-registration
import '../library/richlink/handlers';

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

**Step 2: Add to tab index**

Update `src/tabs/index.tsx`:

```typescript
// Auto-import all tab files
import './github-autoscroll.tab';
import './page-actions.tab';
import './so-sprint.tab';
import './spinnaker.tab';
import './richlink.tab';
```

**Step 3: Test manually**

Build: `npm run dev`
Test: Open extension on GitHub, verify Rich Link tab appears with priority 0

**Step 4: Commit**

```bash
git add src/tabs/richlink.tab.tsx src/tabs/index.tsx
git commit -m "feat(richlink): register Rich Link tab with variable priority"
```

---

## Task 14: Integration testing

**Files:**
- Create: `tests/integration/richlink.integration.test.tsx`

**Step 1: Write integration test**

Create `tests/integration/richlink.integration.test.tsx`:

```typescript
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {HandlerRegistry} from '../../src/library/richlink/handlers';

describe('Rich Link Integration', () => {
    beforeEach(() => {
        // Mock DOM
        vi.stubGlobal('document', {
            title: 'Test Page',
            querySelector: vi.fn(),
        });
        vi.stubGlobal('window', {
            location: {
                href: 'https://github.com/user/repo/pull/123',
            },
        });
    });

    it('should load all handlers', () => {
        expect(HandlerRegistry.hasSpecializedHandler('https://github.com/repo')).toBe(true);
        expect(HandlerRegistry.hasSpecializedHandler('https://example.com')).toBe(false);
    });

    it('should return formats in priority order', async () => {
        const formats = await HandlerRegistry.getAllFormats('https://github.com/user/repo');
        expect(formats.length).toBeGreaterThan(0);

        // GitHub should be first (priority 10)
        expect(formats[0].label).toBe('GitHub PR');

        // Page Title should be second-to-last (priority 100)
        expect(formats[formats.length - 2].label).toBe('Page Title');

        // Raw URL should be last (priority 200)
        expect(formats[formats.length - 1].label).toBe('Raw URL');
    });

    it('should fallback to base handlers on unsupported sites', async () => {
        const formats = await HandlerRegistry.getAllFormats('https://example.com');

        // Should only have base handlers
        expect(formats).toHaveLength(2);
        expect(formats[0].label).toBe('Page Title');
        expect(formats[1].label).toBe('Raw URL');
    });
});
```

**Step 2: Run integration test**

Run: `npm test tests/integration/richlink.integration.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/integration/richlink.integration.test.tsx
git commit -m "test(richlink): add integration tests for handler system"
```

---

## Task 15: Run all tests and verify

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Manual testing checklist**

Test these scenarios:
- [ ] Load extension on GitHub PR - verify Rich Link tab appears with priority 0
- [ ] Click GitHub PR format - verify link copied to clipboard
- [ ] Press Cmd+Shift+C on GitHub PR - verify link copied
- [ ] Press Cmd+Shift+C twice quickly - verify format cycles
- [ ] Load extension on generic page - verify tab appears with priority 100
- [ ] Verify only Page Title and Raw URL formats appear on generic page
- [ ] Verify copy counter increments on each copy
- [ ] Verify copy counter persists after refresh

**Step 4: Final commit**

```bash
git add .
git commit -m "feat(richlink): complete Rich Link integration with all handlers and tests"
```

---

## Post-Implementation Notes

**What was built:**
- Handler-based architecture with 8 handlers (2 base, 6 specialized)
- Handler registry with priority-based ordering
- Tab UI showing all available formats
- Keyboard shortcut (Cmd+Shift+C) with format cycling
- Persistent copy counter displayed in tab
- Full test coverage with unit and integration tests

**Tech decisions:**
- Used additive handler pattern (specialized + base)
- Handlers self-register on module load
- Format cycling uses localStorage with 1s expiry
- Copy counter persists in localStorage
- Tab priority driven by handler availability

**Future enhancements:**
- Add more specialized handlers (Linear, Notion, etc.)
- Add format preview on hover
- Add keyboard shortcuts for specific formats
- Add copy history in tab UI
