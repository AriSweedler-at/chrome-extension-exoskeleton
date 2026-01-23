# Tab Enablement Library - Implementation Plan

## Overview

Create a reusable tab enablement library feature that allows any tab in the Chrome extension to opt into auto-run enablement with a single configuration line: `enablementToggle: true`. This will refactor GitHub autoscroll's manual enablement code into a centralized library feature.

## Goals

1. Create reusable `useTabEnablement` hook and `TabEnablementSection` component
2. Add `enablementToggle` field to `TabRegistry` interface
3. Auto-inject enablement UI via `TabBar` for tabs that opt in
4. Migrate GitHub autoscroll to use the library feature
5. Create new Spinnaker tab with enablement enabled

## Architecture

### Components

1. **useTabEnablement Hook** - React hook for managing enabled/disabled state
   - Persists to Chrome storage with key pattern: `exorun-{tabId}`
   - Returns: `{enabled, loading, setEnabled}`

2. **TabEnablementSection Component** - UI component for the enablement toggle
   - Renders "Enable on page load:" checkbox
   - Uses `useTabEnablement` hook internally

3. **TabRegistry Enhancement** - Add optional `enablementToggle?: boolean` field

4. **TabBar Auto-Injection** - Automatically render `TabEnablementSection` when `enablementToggle: true`

---

## Task 1: Create useTabEnablement Hook

**Files:**
- Create: `src/library/tabs/use-tab-enablement.tsx`
- Test: `tests/library/use-tab-enablement.test.tsx`

### Step 1: Write the failing test

Create `tests/library/use-tab-enablement.test.tsx`:

```typescript
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useTabEnablement} from '../../src/library/tabs/use-tab-enablement';

describe('useTabEnablement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.chrome = {
            storage: {
                local: {
                    get: vi.fn((keys, callback) => {
                        callback({});
                    }),
                    set: vi.fn((items, callback) => {
                        if (callback) callback();
                    }),
                },
            },
        } as any;
    });

    it('defaults to enabled when no stored value exists', async () => {
        const {result} = renderHook(() => useTabEnablement('test-tab'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.enabled).toBe(true);
    });

    it('loads stored enabled state from chrome storage', async () => {
        global.chrome.storage.local.get = vi.fn((keys, callback) => {
            callback({'exorun-test-tab': false});
        });

        const {result} = renderHook(() => useTabEnablement('test-tab'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.enabled).toBe(false);
    });

    it('updates chrome storage when setEnabled is called', async () => {
        const {result} = renderHook(() => useTabEnablement('test-tab'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await result.current.setEnabled(false);

        expect(chrome.storage.local.set).toHaveBeenCalledWith(
            {'exorun-test-tab': false},
            expect.any(Function)
        );
    });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/library/use-tab-enablement.test.tsx
```

**Expected:** FAIL with "Cannot find module"

### Step 3: Write minimal implementation

Create `src/library/tabs/use-tab-enablement.tsx`:

```typescript
import {useState, useEffect} from 'react';
import {Storage} from '../storage';

export function useTabEnablement(tabId: string) {
    const [enabled, setEnabled] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadEnabled = async () => {
            const value = await Storage.get<boolean>(`exorun-${tabId}`);
            setEnabled(value === undefined ? true : value);
            setLoading(false);
        };
        loadEnabled();
    }, [tabId]);

    const updateEnabled = async (newValue: boolean) => {
        await Storage.set(`exorun-${tabId}`, newValue);
        setEnabled(newValue);
    };

    return {enabled, loading, setEnabled: updateEnabled};
}
```

### Step 4: Run test to verify it passes

```bash
npm test -- tests/library/use-tab-enablement.test.tsx
```

**Expected:** PASS (3 tests)

### Step 5: Commit

```bash
git add src/library/tabs/use-tab-enablement.tsx tests/library/use-tab-enablement.test.tsx
git commit -m "feat: add useTabEnablement hook for tab auto-run state management"
```

---

## Task 2: Create TabEnablementSection Component

**Files:**
- Create: `src/library/tabs/TabEnablementSection.tsx`
- Test: `tests/library/TabEnablementSection.test.tsx`

### Step 1: Write the failing test

Create `tests/library/TabEnablementSection.test.tsx`:

```typescript
import {describe, it, expect, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {TabEnablementSection} from '../../src/library/tabs/TabEnablementSection';

vi.mock('../../src/library/tabs/use-tab-enablement', () => ({
    useTabEnablement: vi.fn(),
}));

import {useTabEnablement} from '../../src/library/tabs/use-tab-enablement';

describe('TabEnablementSection', () => {
    it('renders with enabled label when enabled is true', async () => {
        (useTabEnablement as any).mockReturnValue({
            enabled: true,
            loading: false,
            setEnabled: vi.fn(),
        });

        render(<TabEnablementSection tabId="test-tab" />);

        await waitFor(() => {
            expect(screen.getByText('Enable on page load:')).toBeInTheDocument();
            expect(screen.getByText('Enabled')).toBeInTheDocument();
        });
    });

    it('renders with disabled label when enabled is false', async () => {
        (useTabEnablement as any).mockReturnValue({
            enabled: false,
            loading: false,
            setEnabled: vi.fn(),
        });

        render(<TabEnablementSection tabId="test-tab" />);

        await waitFor(() => {
            expect(screen.getByText('Disabled')).toBeInTheDocument();
        });
    });

    it('calls setEnabled when checkbox is clicked', async () => {
        const user = userEvent.setup();
        const mockSetEnabled = vi.fn();

        (useTabEnablement as any).mockReturnValue({
            enabled: true,
            loading: false,
            setEnabled: mockSetEnabled,
        });

        render(<TabEnablementSection tabId="test-tab" />);

        const checkbox = screen.getByRole('checkbox');
        await user.click(checkbox);

        expect(mockSetEnabled).toHaveBeenCalledWith(false);
    });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/library/TabEnablementSection.test.tsx
```

**Expected:** FAIL with "Cannot find module"

### Step 3: Write minimal implementation

Create `src/library/tabs/TabEnablementSection.tsx`:

```typescript
import React from 'react';
import {useTabEnablement} from './use-tab-enablement';

interface TabEnablementSectionProps {
    tabId: string;
}

export function TabEnablementSection({tabId}: TabEnablementSectionProps) {
    const {enabled, loading, setEnabled} = useTabEnablement(tabId);

    if (loading) {
        return null;
    }

    const handleToggle = async () => {
        await setEnabled(!enabled);
    };

    return (
        <div
            style={{
                borderTop: '1px solid #ccc',
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <span>Enable on page load:</span>
            <label
                htmlFor={`enablement-checkbox-${tabId}`}
                style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}
            >
                <input
                    id={`enablement-checkbox-${tabId}`}
                    type="checkbox"
                    checked={enabled}
                    onChange={handleToggle}
                    style={{marginRight: '8px', cursor: 'pointer'}}
                />
                <span>{enabled ? 'Enabled' : 'Disabled'}</span>
            </label>
        </div>
    );
}
```

### Step 4: Run test to verify it passes

```bash
npm test -- tests/library/TabEnablementSection.test.tsx
```

**Expected:** PASS (3 tests)

### Step 5: Commit

```bash
git add src/library/tabs/TabEnablementSection.tsx tests/library/TabEnablementSection.test.tsx
git commit -m "feat: add TabEnablementSection component for UI"
```

---

## Task 3: Update TabRegistry Interface

**Files:**
- Modify: `src/library/tabs/tab-registry.tsx:8`
- Test: `tests/library/tab-registry.test.tsx`

### Step 1: Write the failing test

Add to `tests/library/tab-registry.test.tsx`:

```typescript
it('should support enablementToggle field', () => {
    TabRegistry.register({
        id: 'test-enablement',
        label: 'Test',
        component: TestComponent,
        getPriority: () => 100,
        enablementToggle: true,
    });

    const tabs = TabRegistry.getVisibleTabs('http://example.com');
    const tab = tabs.find((t) => t.id === 'test-enablement');
    expect(tab).toBeDefined();
    expect(tab?.enablementToggle).toBe(true);
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/library/tab-registry.test.tsx
```

**Expected:** FAIL with "Property 'enablementToggle' does not exist on type 'TabRegistration'"

### Step 3: Update TabRegistry interface

Modify `src/library/tabs/tab-registry.tsx`:

```typescript
export interface TabRegistration {
    id: string;
    label: string;
    component: ComponentType;
    getPriority: (url: string) => number;
    enablementToggle?: boolean;
}
```

### Step 4: Run test to verify it passes

```bash
npm test -- tests/library/tab-registry.test.tsx
```

**Expected:** PASS (all tests including new one)

### Step 5: Commit

```bash
git add src/library/tabs/tab-registry.tsx tests/library/tab-registry.test.tsx
git commit -m "feat: add enablementToggle field to TabRegistration interface"
```

---

## Task 4: Update TabBar to Auto-Inject Enablement Section

**Files:**
- Modify: `src/popup/TabBar.tsx:54-60`
- Test: `tests/popup/TabBar.test.tsx`

### Step 1: Write the failing test

Add to `tests/popup/TabBar.test.tsx`:

```typescript
it('renders TabEnablementSection for tabs with enablementToggle', async () => {
    const TestComponent = () => <div>Test Content</div>;

    TabRegistry.register({
        id: 'test-enablement',
        label: 'Test',
        component: TestComponent,
        getPriority: () => 0,
        enablementToggle: true,
    });

    render(<TabBar />);

    await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    expect(screen.getByText('Enable on page load:')).toBeInTheDocument();
});

it('does not render TabEnablementSection for tabs without enablementToggle', async () => {
    const TestComponent = () => <div>Test Content</div>;

    TabRegistry.register({
        id: 'test-no-enablement',
        label: 'Test',
        component: TestComponent,
        getPriority: () => 0,
    });

    render(<TabBar />);

    await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    expect(screen.queryByText('Enable on page load:')).not.toBeInTheDocument();
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/popup/TabBar.test.tsx
```

**Expected:** FAIL (enablement section not rendered)

### Step 3: Update TabBar component

Modify `src/popup/TabBar.tsx`:

```typescript
import {TabEnablementSection} from '../library/tabs/TabEnablementSection';

// ... inside render, after selectedTab.component:

<div className="tab-content">
    {selectedTab && (
        <TabErrorBoundary>
            <selectedTab.component />

            {selectedTab.enablementToggle && (
                <TabEnablementSection tabId={selectedTab.id} />
            )}
        </TabErrorBoundary>
    )}
</div>
```

### Step 4: Run test to verify it passes

```bash
npm test -- tests/popup/TabBar.test.tsx
```

**Expected:** PASS (all tests)

### Step 5: Commit

```bash
git add src/popup/TabBar.tsx tests/popup/TabBar.test.tsx
git commit -m "feat: auto-inject TabEnablementSection in TabBar for tabs with enablementToggle"
```

---

## Task 5: Migrate GitHub Autoscroll to Use Library Feature

**Files:**
- Modify: `src/tabs/github-autoscroll.tab.tsx`
- Modify: `src/components/GitHubAutoscrollComponent.tsx`
- Test: `tests/components/GitHubAutoscrollComponent.test.tsx`

### Step 1: Update tab registration

Modify `src/tabs/github-autoscroll.tab.tsx`:

Add `enablementToggle: true` to the `TabRegistry.register` call:

```typescript
TabRegistry.register({
    id: 'github-autoscroll',
    label: 'Autoscroll',
    component: GitHubAutoscrollComponent,
    getPriority: (url: string) => {
        if (isGitHubPRChangesPage(url)) {
            return 0;
        }
        return Number.MAX_SAFE_INTEGER;
    },
    enablementToggle: true,  // ADD THIS LINE
});
```

### Step 2: Remove manual enablement code from component

Modify `src/components/GitHubAutoscrollComponent.tsx`:

Remove these sections:
1. Remove Storage import
2. Remove `autoRunEnabled` state variable
3. Remove storage loading logic from `useEffect`
4. Remove `handleAutoRunToggle` function
5. Remove the entire auto-run preference UI section (the div with "Auto-run on page load:" checkbox)

Keep:
- The session toggle logic (active/inactive button)
- The message passing to content script
- Error handling

### Step 3: Update tests

Modify `tests/components/GitHubAutoscrollComponent.test.tsx`:

Remove any assertions checking for "Auto-run on page load:" text since that's now provided by `TabEnablementSection`.

### Step 4: Run tests

```bash
npm test -- tests/components/GitHubAutoscrollComponent.test.tsx
npm test -- tests/popup/TabBar.test.tsx
```

**Expected:** PASS (all tests)

### Step 5: Commit

```bash
git add src/tabs/github-autoscroll.tab.tsx src/components/GitHubAutoscrollComponent.tsx tests/components/GitHubAutoscrollComponent.test.tsx
git commit -m "refactor: migrate GitHub autoscroll to use library enablement feature"
```

---

## Task 6: Create Spinnaker Tab URL Detection

**Files:**
- Create: `src/library/spinnaker.ts`
- Test: `tests/library/spinnaker.test.ts`

### Step 1: Write the failing test

Create `tests/library/spinnaker.test.ts`:

```typescript
import {describe, it, expect} from 'vitest';
import {isSpinnakerSearchPage} from '../../src/library/spinnaker';

describe('isSpinnakerSearchPage', () => {
    it('returns true for spinnaker.k8s.shadowbox.cloud search page', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/search')).toBe(true);
    });

    it('returns true for spinnaker.k8s.alpha-shadowbox.cloud search page', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.alpha-shadowbox.cloud/#/search')).toBe(true);
    });

    it('returns true for search page with query params', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/search?q=test')).toBe(true);
    });

    it('returns false for non-search Spinnaker pages', () => {
        expect(isSpinnakerSearchPage('https://spinnaker.k8s.shadowbox.cloud/#/applications')).toBe(false);
    });

    it('returns false for non-Spinnaker URLs', () => {
        expect(isSpinnakerSearchPage('https://github.com/owner/repo')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
        expect(isSpinnakerSearchPage('not-a-url')).toBe(false);
    });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/library/spinnaker.test.ts
```

**Expected:** FAIL with "Cannot find module '../../src/library/spinnaker'"

### Step 3: Write minimal implementation

Create `src/library/spinnaker.ts`:

```typescript
/**
 * Check if URL is a Spinnaker search page
 */
export function isSpinnakerSearchPage(url: string): boolean {
    try {
        const urlObj = new URL(url);

        // Check hostname
        const hostname = urlObj.hostname.toLowerCase();
        const validHostnames = [
            'spinnaker.k8s.shadowbox.cloud',
            'spinnaker.k8s.alpha-shadowbox.cloud',
        ];

        if (!validHostnames.includes(hostname)) {
            return false;
        }

        // Check hash contains /search
        return urlObj.hash.startsWith('#/search');
    } catch {
        // Invalid URL
        return false;
    }
}
```

### Step 4: Run test to verify it passes

```bash
npm test -- tests/library/spinnaker.test.ts
```

**Expected:** PASS (6 tests)

### Step 5: Commit

```bash
git add src/library/spinnaker.ts tests/library/spinnaker.test.ts
git commit -m "feat: add Spinnaker URL detection utility"
```

---

## Task 7: Create Spinnaker Component

**Files:**
- Create: `src/components/SpinnakerComponent.tsx`
- Test: `tests/components/SpinnakerComponent.test.tsx`

### Step 1: Write the failing test

Create `tests/components/SpinnakerComponent.test.tsx`:

```typescript
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {SpinnakerContent} from '../../src/components/SpinnakerComponent';

describe('SpinnakerContent', () => {
    it('renders placeholder message', () => {
        render(<SpinnakerContent />);
        expect(screen.getByText(/Spinnaker/)).toBeInTheDocument();
    });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/components/SpinnakerComponent.test.tsx
```

**Expected:** FAIL with "Cannot find module"

### Step 3: Write minimal implementation

Create `src/components/SpinnakerComponent.tsx`:

```typescript
import React from 'react';

export function SpinnakerContent() {
    return (
        <div style={{padding: '16px'}}>
            <h2>Spinnaker</h2>
            <p>Spinnaker search functionality coming soon.</p>
        </div>
    );
}
```

### Step 4: Run test to verify it passes

```bash
npm test -- tests/components/SpinnakerComponent.test.tsx
```

**Expected:** PASS (1 test)

### Step 5: Commit

```bash
git add src/components/SpinnakerComponent.tsx tests/components/SpinnakerComponent.test.tsx
git commit -m "feat: add Spinnaker component placeholder"
```

---

## Task 8: Register Spinnaker Tab

**Files:**
- Create: `src/tabs/spinnaker.tab.tsx`
- Test: `tests/tabs/spinnaker.tab.test.tsx`
- Modify: `src/tabs/index.tsx`

### Step 1: Write the failing test

Create `tests/tabs/spinnaker.tab.test.tsx`:

```typescript
import {describe, it, expect, beforeEach} from 'vitest';
import {TabRegistry} from '../../src/library/tabs/tab-registry';

describe('Spinnaker Tab Registration', () => {
    beforeEach(async () => {
        await import('../../src/tabs/spinnaker.tab');
    });

    it('registers spinnaker tab', () => {
        const tabs = TabRegistry.getVisibleTabs('https://spinnaker.k8s.shadowbox.cloud/#/search');
        expect(tabs.length).toBe(1);
        expect(tabs[0].id).toBe('spinnaker');
        expect(tabs[0].label).toBe('Spinnaker');
    });

    it('has priority 0 on Spinnaker search pages', () => {
        const tabs = TabRegistry.getVisibleTabs('https://spinnaker.k8s.shadowbox.cloud/#/search');
        expect(tabs[0].priority).toBe(0);
    });

    it('is not visible on non-Spinnaker pages', () => {
        const tabs = TabRegistry.getVisibleTabs('https://github.com/owner/repo');
        expect(tabs.length).toBe(0);
    });

    it('has enablementToggle enabled', () => {
        const tabs = TabRegistry.getVisibleTabs('https://spinnaker.k8s.shadowbox.cloud/#/search');
        expect(tabs[0].enablementToggle).toBe(true);
    });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- tests/tabs/spinnaker.tab.test.tsx
```

**Expected:** FAIL with "Cannot find module '../../src/tabs/spinnaker.tab'"

### Step 3: Write minimal implementation

Create `src/tabs/spinnaker.tab.tsx`:

```typescript
import {TabRegistry} from '../library/tabs/tab-registry';
import {SpinnakerContent} from '../components/SpinnakerComponent';
import {isSpinnakerSearchPage} from '../library/spinnaker';

const SpinnakerComponent = () => {
    return <SpinnakerContent />;
};

TabRegistry.register({
    id: 'spinnaker',
    label: 'Spinnaker',
    component: SpinnakerComponent,
    getPriority: (url: string) => {
        if (isSpinnakerSearchPage(url)) {
            return 0;
        }
        return Number.MAX_SAFE_INTEGER;
    },
    enablementToggle: true,
});
```

### Step 4: Update index to import tab

Modify `src/tabs/index.tsx`:

Add after existing imports:
```typescript
import './spinnaker.tab';
```

### Step 5: Run test to verify it passes

```bash
npm test -- tests/tabs/spinnaker.tab.test.tsx
```

**Expected:** PASS (4 tests)

### Step 6: Commit

```bash
git add src/tabs/spinnaker.tab.tsx tests/tabs/spinnaker.tab.test.tsx src/tabs/index.tsx
git commit -m "feat: register Spinnaker tab with enablement support"
```

---

## Task 9: Export New Library Components

**Files:**
- Modify: `src/library/index.tsx`

### Step 1: Add exports

Modify `src/library/index.tsx`:

Add these exports:
```typescript
export {useTabEnablement} from './tabs/use-tab-enablement';
export {TabEnablementSection} from './tabs/TabEnablementSection';
export {isSpinnakerSearchPage} from './spinnaker';
```

### Step 2: Verify TypeScript compilation

```bash
npm run typecheck
```

**Expected:** No errors

### Step 3: Commit

```bash
git add src/library/index.tsx
git commit -m "feat: export tab enablement hook and component from library"
```

---

## Task 10: Final Integration Test

No files to modify - verification only

### Step 1: Run complete test suite

```bash
npm test
```

**Expected:** All tests passing

### Step 2: Run build

```bash
npm run build
```

**Expected:** Build succeeds

### Step 3: Verify integration

- GitHub autoscroll tab has enablement toggle (via library)
- Spinnaker tab has enablement toggle (via library)
- All existing functionality still works
- No console errors

**Success Criteria:**
- All tests passing (195+ tests)
- Build successful
- Both tabs show enablement UI
- Storage keys follow pattern: `exorun-{tabId}`

---

## Summary

This implementation creates a reusable tab enablement library that:

1. **Reduces code duplication** - Tabs get enablement for free with `enablementToggle: true`
2. **Centralizes UI** - Consistent enablement toggle across all tabs
3. **Type-safe** - Full TypeScript support
4. **Well-tested** - 19+ new tests covering all functionality
5. **Backwards compatible** - Optional field, existing tabs unaffected

**Future adoption:** Any new tab can add enablement by setting `enablementToggle: true` in their registration. No additional code needed.
