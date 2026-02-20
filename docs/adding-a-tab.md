# Adding a New Tab

Tabs are the top-level unit of functionality in the extension. Each tab targets specific websites, renders its own UI in the popup, and can respond to the universal keyboard shortcut (Cmd+Shift+X).

## Structure

Each tab is a self-contained folder under `src/exo-tabs/`:

```
src/exo-tabs/my-feature/
  tab.tsx              # TabRegistry.register() — auto-discovered
  tab.test.tsx         # registration + URL matching tests
  MyComponent.tsx      # React component for the popup UI
  index.ts             # domain logic, URL matching helpers
  content-handler.ts   # content script handler (if needed)
```

Tabs are auto-discovered — `exo-tabs/index.tsx` uses `import.meta.glob('./*/tab.tsx', {eager: true})` to find all tab registrations at build time. No manual imports needed.

## Step 1: Create the Tab Folder

```bash
mkdir src/exo-tabs/my-feature
```

Create `src/exo-tabs/my-feature/index.ts` with domain logic:

```ts
export function isMyFeaturePage(url: string): boolean {
    return url.includes('example.com');
}
```

Create `src/exo-tabs/my-feature/MyComponent.tsx`:

```tsx
import {theme} from '@exo/theme/default';

export function MyComponent() {
    return (
        <div style={{padding: '16px'}}>
            <h2 style={{marginTop: 0, marginBottom: '16px'}}>My Feature</h2>
            <p style={{color: theme.text.secondary}}>Hello from my new tab.</p>
        </div>
    );
}
```

Use colors from `@exo/theme/default` — never hardcode color values in components.

## Step 2: Register the Tab

Create `src/exo-tabs/my-feature/tab.tsx`:

```tsx
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {MyComponent} from '@exo/exo-tabs/my-feature/MyComponent';
import {isMyFeaturePage} from '@exo/exo-tabs/my-feature';

TabRegistry.register({
    id: 'my-feature',
    label: 'My Feature',
    component: MyComponent,

    getPriority: (url: string) => {
        if (isMyFeaturePage(url)) return 0;
        return Number.MAX_SAFE_INTEGER;
    },

    primaryAction: async (tabId: number, url: string) => {
        return false;
    },

    // enablementToggle: true,  // optional: show enable/disable toggle
});
```

That's it — the glob pattern in `exo-tabs/index.tsx` will pick it up automatically.

## Step 3: Write Tests

Create `src/exo-tabs/my-feature/tab.test.tsx`:

```tsx
import {describe, it, expect} from 'vitest';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import '@exo/exo-tabs/my-feature/tab';

describe('My Feature Tab', () => {
    it('registers with correct id and label', () => {
        const tabs = TabRegistry.getVisibleTabs('https://example.com');
        const tab = tabs.find((t: {id: string}) => t.id === 'my-feature');
        expect(tab).toBeDefined();
        expect(tab?.label).toBe('My Feature');
    });

    it('is visible on matching URLs', () => {
        const tabs = TabRegistry.getVisibleTabs('https://example.com/page');
        expect(tabs.find((t: {id: string}) => t.id === 'my-feature')).toBeDefined();
    });

    it('is hidden on non-matching URLs', () => {
        const tabs = TabRegistry.getVisibleTabs('https://other-site.com');
        expect(tabs.find((t: {id: string}) => t.id === 'my-feature')).toBeUndefined();
    });
});
```

## Import Convention

Use `@exo/*` for all imports. It maps to `src/*`.

```typescript
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {theme} from '@exo/theme/default';
import {isMyFeaturePage} from '@exo/exo-tabs/my-feature';
```

## Reference

### `TabRegistration` Interface

```typescript
interface TabRegistration {
    id: string;
    label: string;
    component: ComponentType;
    getPriority: (url: string) => number;
    primaryAction: (tabId: number, url: string) => Promise<boolean>;
    enablementToggle?: boolean;
}
```

### `getPriority(url)`

| Return value | Meaning |
|---|---|
| `0` | Visible, highest priority |
| `1`, `2`, ... | Visible, lower priority |
| `Number.MAX_SAFE_INTEGER` | Hidden for this URL |

### `primaryAction(tabId, url)`

Called on **Cmd+Shift+X**. Return `true` if handled, `false` to pass to the next tab.

### Communicating with Content Scripts

Create an action class in `src/lib/actions/` and a content handler in your tab folder:

```
src/lib/actions/my-action.action.ts          # typed message contract
src/exo-tabs/my-feature/content-handler.ts   # handler logic
src/index.tsx                                # wire up the handler
```

See `ExtractLogCommandAction` and `exo-tabs/opensearch/content-handler.ts` for a working example.
