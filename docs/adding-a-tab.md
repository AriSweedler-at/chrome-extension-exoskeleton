# Adding a New Tab

Tabs are the top-level unit of functionality in the extension. Each tab targets specific websites, renders its own UI in the popup, and can respond to the universal keyboard shortcut (Cmd+Shift+X).

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/components/MyFeatureComponent.tsx` | React component for the popup UI |
| `src/tabs/my-feature.tab.tsx` | Tab registration (URL matching, priority, primary action) |
| `src/tabs/index.tsx` | Add import to trigger registration |
| `tests/tabs/my-feature.test.tsx` | Tests for URL matching and registration |

## Step 1: Create the Component

Create `src/components/MyFeatureComponent.tsx`:

```tsx
import {theme} from '../theme/default';

export function MyFeatureComponent() {
    return (
        <div style={{padding: '16px'}}>
            <h2 style={{marginTop: 0, marginBottom: '16px'}}>My Feature</h2>
            <p style={{color: theme.text.secondary}}>Hello from my new tab.</p>
        </div>
    );
}
```

Use colors from `theme` — never hardcode hex/rgba/hsla values in components.

## Step 2: Register the Tab

Create `src/tabs/my-feature.tab.tsx`:

```tsx
import {TabRegistry} from '../library/tabs/tab-registry';
import {MyFeatureComponent} from '../components/MyFeatureComponent';

TabRegistry.register({
    id: 'my-feature',
    label: 'My Feature',
    component: MyFeatureComponent,

    getPriority: (url: string) => {
        if (url.includes('example.com')) return 0;
        return Number.MAX_SAFE_INTEGER;
    },

    primaryAction: async (tabId, url) => {
        // Return true if this tab handled the action, false to pass to the next tab
        return false;
    },

    // Optional: show an enable/disable toggle in the popup
    // enablementToggle: true,
});
```

## Step 3: Import the Tab

Add a side-effect import to `src/tabs/index.tsx`:

```tsx
import './my-feature.tab';
```

This ensures the tab registers before the popup renders.

## Step 4: Write Tests

Create `tests/tabs/my-feature.test.tsx`:

```tsx
import {describe, it, expect, beforeAll} from 'vitest';
import {TabRegistry} from '../../src/library/tabs/tab-registry';
import '../../src/tabs/my-feature.tab';

describe('My Feature Tab', () => {
    it('registers with correct id and label', () => {
        const tabs = TabRegistry.getVisibleTabs('https://example.com');
        const tab = tabs.find((t) => t.id === 'my-feature');
        expect(tab).toBeDefined();
        expect(tab?.label).toBe('My Feature');
    });

    it('is visible on matching URLs', () => {
        const tabs = TabRegistry.getVisibleTabs('https://example.com/page');
        expect(tabs.find((t) => t.id === 'my-feature')).toBeDefined();
    });

    it('is hidden on non-matching URLs', () => {
        const tabs = TabRegistry.getVisibleTabs('https://other-site.com');
        expect(tabs.find((t) => t.id === 'my-feature')).toBeUndefined();
    });
});
```

## Reference

### `TabRegistration` Interface

```typescript
interface TabRegistration {
    id: string;                    // Unique identifier
    label: string;                 // Display name in the popup tab bar
    component: ComponentType;      // React component rendered in popup
    getPriority: (url: string) => number;
    primaryAction: (tabId: number, url: string) => Promise<boolean>;
    enablementToggle?: boolean;    // Show enable/disable toggle
}
```

### `getPriority(url)`

Controls when the tab appears and in what order.

| Return value | Meaning |
|---|---|
| `0` | Visible, highest priority |
| `1`, `2`, ... | Visible, lower priority |
| `Number.MAX_SAFE_INTEGER` | Hidden for this URL |

Tabs are sorted ascending — lower number appears first.

### `primaryAction(tabId, url)`

Called when the user presses **Cmd+Shift+X**. The system iterates visible tabs by priority and stops at the first one that returns `true`.

- Return `true` — action handled, stop iterating
- Return `false` — pass to the next tab

If your tab doesn't have a keyboard action yet, use `async () => false`.

### `enablementToggle`

When `true`, a toggle switch ("Enable on page load") appears below your component. State persists in `chrome.storage.local` under the key `exorun-{tabId}`. Read it in your content script via `useTabEnablement(tabId)`.

### Communicating with Content Scripts

If your tab needs to run code in the page, create an action class:

```
src/actions/my-action.action.ts     — Action definition
src/content/my-feature-handler.ts   — Content script handler
```

Use `Action.sendToTab(tabId, payload)` from the popup or `primaryAction`, and `Action.handle(...)` in the content script. See `ExtractLogCommandAction` for a working example.
