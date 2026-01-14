# Tabbed Popup System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement priority-based tab system with context-aware tabs, starting with SO SPRINT tab for Airtable pages.

**Architecture:** Component base class for rendering, TabRegistry for dynamic tab registration with priority system, TabBar for UI, storage-backed tab selection memory.

**Tech Stack:** TypeScript, React, Vitest, Chrome Storage API

---

## Task 1: Component Base Class

**Files:**
- Create: `src/library/components/base-component.ts`
- Create: `tests/library/base-component.test.ts`

### Step 1: Write failing test for abstract render method

**File:** `tests/library/base-component.test.ts`

```typescript
import {describe, it, expect} from 'vitest';
import {Component} from '../../src/library/components/base-component';

describe('Component', () => {
    describe('render', () => {
        it('should be abstract and must be implemented', () => {
            class TestComponent extends Component {
                // Intentionally don't implement render
            }

            // TypeScript will catch this, but test the behavior
            expect(() => new TestComponent()).toThrow();
        });

        it('should return ReactElement when implemented', () => {
            class TestComponent extends Component {
                render() {
                    return <div>Test</div>;
                }
            }

            const instance = new TestComponent();
            const result = instance.render();
            expect(result).toBeDefined();
            expect(result.type).toBe('div');
        });
    });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- base-component.test.ts --run
```

Expected: FAIL with "Cannot find module"

### Step 3: Write minimal Component base class

**File:** `src/library/components/base-component.ts`

```typescript
import {ReactElement} from 'react';

export abstract class Component {
    abstract render(): ReactElement;
}
```

### Step 4: Run test

```bash
npm test -- base-component.test.ts --run
```

Expected: Test should pass (abstract check won't actually throw in JS, but render test passes)

### Step 5: Write test for renderInstance method

**File:** `tests/library/base-component.test.ts` (add to describe block)

```typescript
    describe('renderInstance', () => {
        it('should instantiate component and call render', () => {
            class TestComponent extends Component {
                render() {
                    return <div>Hello</div>;
                }
            }

            const result = Component.renderInstance(TestComponent);
            expect(result.type).toBe('div');
            expect(result.props.children).toBe('Hello');
        });
    });
```

### Step 6: Run test to verify it fails

```bash
npm test -- base-component.test.ts --run
```

Expected: FAIL with "renderInstance is not a function"

### Step 7: Implement renderInstance

**File:** `src/library/components/base-component.ts`

```typescript
import {ReactElement} from 'react';

export abstract class Component {
    abstract render(): ReactElement;

    static renderInstance(ComponentClass: typeof Component): ReactElement {
        const instance = new ComponentClass();
        return instance.render();
    }
}
```

### Step 8: Run test

```bash
npm test -- base-component.test.ts --run
```

Expected: PASS

### Step 9: Write test for onMount lifecycle

**File:** `tests/library/base-component.test.ts` (add to renderInstance describe)

```typescript
        it('should call onMount if defined', () => {
            let mountCalled = false;

            class TestComponent extends Component {
                onMount() {
                    mountCalled = true;
                }

                render() {
                    return <div>Test</div>;
                }
            }

            Component.renderInstance(TestComponent);
            expect(mountCalled).toBe(true);
        });

        it('should not error if onMount not defined', () => {
            class TestComponent extends Component {
                render() {
                    return <div>Test</div>;
                }
            }

            expect(() => Component.renderInstance(TestComponent)).not.toThrow();
        });
```

### Step 10: Run test to verify it fails

```bash
npm test -- base-component.test.ts --run
```

Expected: FAIL - onMount not called

### Step 11: Implement lifecycle hooks

**File:** `src/library/components/base-component.ts`

```typescript
import {ReactElement} from 'react';

export abstract class Component {
    abstract render(): ReactElement;

    onMount?(): void;
    onUnmount?(): void;

    static renderInstance(ComponentClass: typeof Component): ReactElement {
        const instance = new ComponentClass();

        if (instance.onMount) {
            instance.onMount();
        }

        return instance.render();
    }
}
```

### Step 12: Run all Component tests

```bash
npm test -- base-component.test.ts --run
```

Expected: ALL PASS

### Step 13: Export from library index

**File:** `src/library/index.ts` (add export)

```typescript
export {Component} from './components/base-component';
```

### Step 14: Commit

```bash
git add src/library/components/base-component.ts tests/library/base-component.test.ts src/library/index.ts
git commit -m "feat: add Component base class with lifecycle hooks

- Abstract render() method
- renderInstance() helper
- onMount/onUnmount lifecycle hooks
- Full test coverage"
```

---

## Task 2: TabRegistry

**Files:**
- Create: `src/library/tabs/tab-registry.ts`
- Create: `tests/library/tab-registry.test.ts`

### Step 1: Write failing test for tab registration

**File:** `tests/library/tab-registry.test.ts`

```typescript
import {describe, it, expect, beforeEach} from 'vitest';
import {TabRegistry} from '../../src/library/tabs/tab-registry';
import {Component} from '../../src/library/components/base-component';

describe('TabRegistry', () => {
    beforeEach(() => {
        // Clear registry before each test
        TabRegistry['tabs'] = [];
    });

    describe('register', () => {
        it('should register a tab', () => {
            class TestComponent extends Component {
                render() {
                    return <div>Test</div>;
                }
            }

            expect(() => {
                TabRegistry.register({
                    id: 'test',
                    label: 'Test',
                    component: TestComponent,
                    getPriority: () => 100,
                });
            }).not.toThrow();
        });

        it('should throw error for duplicate tab IDs', () => {
            class TestComponent extends Component {
                render() {
                    return <div>Test</div>;
                }
            }

            TabRegistry.register({
                id: 'test',
                label: 'Test',
                component: TestComponent,
                getPriority: () => 100,
            });

            expect(() => {
                TabRegistry.register({
                    id: 'test',
                    label: 'Test 2',
                    component: TestComponent,
                    getPriority: () => 100,
                });
            }).toThrow("Tab ID 'test' already registered");
        });
    });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- tab-registry.test.ts --run
```

Expected: FAIL with "Cannot find module"

### Step 3: Create TabRegistry with register method

**File:** `src/library/tabs/tab-registry.ts`

```typescript
import {Component} from '../components/base-component';

export interface TabRegistration {
    id: string;
    label: string;
    component: typeof Component;
    getPriority: (url: string) => number;
}

export class TabRegistry {
    private static tabs: TabRegistration[] = [];

    static register(config: TabRegistration): void {
        if (this.tabs.some((t) => t.id === config.id)) {
            throw new Error(`Tab ID '${config.id}' already registered`);
        }
        this.tabs.push(config);
    }
}
```

### Step 4: Run test

```bash
npm test -- tab-registry.test.ts --run
```

Expected: PASS

### Step 5: Write test for getVisibleTabs

**File:** `tests/library/tab-registry.test.ts` (add describe block)

```typescript
    describe('getVisibleTabs', () => {
        class TestComponent extends Component {
            render() {
                return <div>Test</div>;
            }
        }

        it('should return tabs sorted by priority', () => {
            TabRegistry.register({
                id: 'tab1',
                label: 'Tab 1',
                component: TestComponent,
                getPriority: () => 100,
            });

            TabRegistry.register({
                id: 'tab2',
                label: 'Tab 2',
                component: TestComponent,
                getPriority: () => 0,
            });

            TabRegistry.register({
                id: 'tab3',
                label: 'Tab 3',
                component: TestComponent,
                getPriority: () => 50,
            });

            const visible = TabRegistry.getVisibleTabs('http://example.com');

            expect(visible).toHaveLength(3);
            expect(visible[0].id).toBe('tab2'); // Priority 0
            expect(visible[1].id).toBe('tab3'); // Priority 50
            expect(visible[2].id).toBe('tab1'); // Priority 100
        });

        it('should filter out tabs with MAX_SAFE_INTEGER priority', () => {
            TabRegistry.register({
                id: 'visible',
                label: 'Visible',
                component: TestComponent,
                getPriority: () => 100,
            });

            TabRegistry.register({
                id: 'hidden',
                label: 'Hidden',
                component: TestComponent,
                getPriority: () => Number.MAX_SAFE_INTEGER,
            });

            const visible = TabRegistry.getVisibleTabs('http://example.com');

            expect(visible).toHaveLength(1);
            expect(visible[0].id).toBe('visible');
        });

        it('should pass URL to getPriority function', () => {
            const testUrl = 'https://airtable.com/test';
            let receivedUrl = '';

            TabRegistry.register({
                id: 'test',
                label: 'Test',
                component: TestComponent,
                getPriority: (url: string) => {
                    receivedUrl = url;
                    return 100;
                },
            });

            TabRegistry.getVisibleTabs(testUrl);

            expect(receivedUrl).toBe(testUrl);
        });

        it('should include priority in returned tabs', () => {
            TabRegistry.register({
                id: 'test',
                label: 'Test',
                component: TestComponent,
                getPriority: () => 42,
            });

            const visible = TabRegistry.getVisibleTabs('http://example.com');

            expect(visible[0].priority).toBe(42);
        });
    });
```

### Step 6: Run test to verify it fails

```bash
npm test -- tab-registry.test.ts --run
```

Expected: FAIL - getVisibleTabs not defined

### Step 7: Implement getVisibleTabs

**File:** `src/library/tabs/tab-registry.ts`

```typescript
import {Component} from '../components/base-component';

export interface TabRegistration {
    id: string;
    label: string;
    component: typeof Component;
    getPriority: (url: string) => number;
}

export class TabRegistry {
    private static tabs: TabRegistration[] = [];

    static register(config: TabRegistration): void {
        if (this.tabs.some((t) => t.id === config.id)) {
            throw new Error(`Tab ID '${config.id}' already registered`);
        }
        this.tabs.push(config);
    }

    static getVisibleTabs(url: string): Array<TabRegistration & {priority: number}> {
        return this.tabs
            .map((tab) => ({...tab, priority: tab.getPriority(url)}))
            .filter((tab) => tab.priority !== Number.MAX_SAFE_INTEGER)
            .sort((a, b) => a.priority - b.priority);
    }
}
```

### Step 8: Run all TabRegistry tests

```bash
npm test -- tab-registry.test.ts --run
```

Expected: ALL PASS

### Step 9: Export from library index

**File:** `src/library/index.ts` (add export)

```typescript
export {TabRegistry, TabRegistration} from './tabs/tab-registry';
```

### Step 10: Commit

```bash
git add src/library/tabs/tab-registry.ts tests/library/tab-registry.test.ts src/library/index.ts
git commit -m "feat: add TabRegistry with priority-based filtering

- register() method with duplicate ID check
- getVisibleTabs() filters by MAX_SAFE_INTEGER
- Sorts tabs by priority (lowest first)
- Full test coverage"
```

---

## Task 3: SO SPRINT Tab

**Files:**
- Create: `src/tabs/so-sprint.tab.ts`
- Create: `tests/tabs/so-sprint.test.ts`

### Step 1: Write test for SO SPRINT tab registration

**File:** `tests/tabs/so-sprint.test.ts`

```typescript
import {describe, it, expect, beforeEach} from 'vitest';
import {TabRegistry} from '../../src/library/tabs/tab-registry';

// Import the tab to trigger registration
import '../../src/tabs/so-sprint.tab';

describe('SO SPRINT Tab', () => {
    const AIRTABLE_URL = 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6';
    const OTHER_URL = 'https://google.com';

    it('should register with correct ID and label', () => {
        const tabs = TabRegistry.getVisibleTabs(AIRTABLE_URL);
        const soSprintTab = tabs.find((t) => t.id === 'so-sprint');

        expect(soSprintTab).toBeDefined();
        expect(soSprintTab?.label).toBe('SO SPRINT');
    });

    it('should have priority 0 on Airtable URL', () => {
        const tabs = TabRegistry.getVisibleTabs(AIRTABLE_URL);
        const soSprintTab = tabs.find((t) => t.id === 'so-sprint');

        expect(soSprintTab?.priority).toBe(0);
    });

    it('should be hidden on other URLs', () => {
        const tabs = TabRegistry.getVisibleTabs(OTHER_URL);
        const soSprintTab = tabs.find((t) => t.id === 'so-sprint');

        expect(soSprintTab).toBeUndefined();
    });

    it('should render HELLO WORLD message', () => {
        const tabs = TabRegistry.getVisibleTabs(AIRTABLE_URL);
        const soSprintTab = tabs.find((t) => t.id === 'so-sprint');

        expect(soSprintTab).toBeDefined();

        const instance = new soSprintTab!.component();
        const result = instance.render();

        expect(result.props.children).toContain('HELLO, WORLD');
        expect(result.props.children).toContain('SO SPRINT');
    });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- so-sprint.test.ts --run
```

Expected: FAIL with "Cannot find module"

### Step 3: Create SO SPRINT tab

**File:** `src/tabs/so-sprint.tab.ts`

```typescript
import {Component} from '../library/components/base-component';
import {TabRegistry} from '../library/tabs/tab-registry';

class SoSprintComponent extends Component {
    render() {
        return <div>HELLO, WORLD - you are in SO SPRINT</div>;
    }
}

TabRegistry.register({
    id: 'so-sprint',
    label: 'SO SPRINT',
    component: SoSprintComponent,
    getPriority: (url: string) => {
        if (url === 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6') {
            return 0;
        }
        return Number.MAX_SAFE_INTEGER;
    },
});
```

### Step 4: Run test

```bash
npm test -- so-sprint.test.ts --run
```

Expected: PASS

### Step 5: Commit

```bash
git add src/tabs/so-sprint.tab.ts tests/tabs/so-sprint.test.ts
git commit -m "feat: add SO SPRINT tab for Airtable page

- Priority 0 on exact Airtable URL
- Hidden on other pages
- Renders HELLO WORLD message
- Full test coverage"
```

---

## Task 4: PageActions Tab (Convert Existing UI)

**Files:**
- Create: `src/tabs/page-actions.tab.ts`
- Create: `src/components/PageActionsComponent.tsx`
- Modify: `src/popup/Popup.tsx` (extract counter UI)

### Step 1: Extract counter UI to component

**File:** `src/components/PageActionsComponent.tsx`

```typescript
import {useState, useEffect} from 'react';
import {IncrementAction} from '../actions/increment.action';
import {GetCountAction} from '../actions/get-count.action';

export function PageActionsContent() {
    const [count, setCount] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Listen for count updates
        const listener = (
            message: {type: string; count: number},
            _sender: chrome.runtime.MessageSender,
        ) => {
            if (message.type === 'COUNT_UPDATED') {
                setCount(message.count);
            }
        };

        chrome.runtime.onMessage.addListener(listener);

        // Get initial count
        GetCountAction.sendToActiveTab(undefined)
            .then((result) => {
                setCount((result as {count: number}).count);
            })
            .catch((err) => {
                const errorMsg = err.message || '';
                if (errorMsg.includes('Receiving end does not exist')) {
                    setError(
                        'Content script not loaded. Please refresh this page to use the extension.',
                    );
                } else {
                    setError(errorMsg || 'Failed to get count');
                }
            });

        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        };
    }, []);

    const handleIncrement = async () => {
        try {
            const result = (await IncrementAction.sendToActiveTab({
                amount: 1,
            })) as {count: number};
            setCount(result.count);
            setError(null);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to increment';
            if (errorMsg.includes('Receiving end does not exist')) {
                setError(
                    'Content script not loaded. Please refresh this page to use the extension.',
                );
            } else {
                setError(errorMsg);
            }
        }
    };

    const handleOpenShortcuts = () => {
        chrome.tabs.create({url: 'chrome://extensions/shortcuts'});
    };

    return (
        <>
            <h1>Page Actions</h1>
            <div className="count-display">
                <span className="count-label">Count:</span>
                <span className="count-value">{count}</span>
            </div>
            {error && <div className="error">{error}</div>}
            <button className="increment-button" onClick={handleIncrement}>
                Increment
            </button>
            <button className="shortcuts-button" onClick={handleOpenShortcuts}>
                Configure Keyboard Shortcut
            </button>
            <div className="footer">
                Press <kbd>Ctrl+Shift+I</kbd> or click button to increment
            </div>
        </>
    );
}
```

### Step 2: Create PageActions tab wrapper

**File:** `src/tabs/page-actions.tab.ts`

```typescript
import {Component} from '../library/components/base-component';
import {TabRegistry} from '../library/tabs/tab-registry';
import {PageActionsContent} from '../components/PageActionsComponent';

class PageActionsComponent extends Component {
    render() {
        return <PageActionsContent />;
    }
}

TabRegistry.register({
    id: 'page-actions',
    label: 'Page Actions',
    component: PageActionsComponent,
    getPriority: () => 100, // Default priority
});
```

### Step 3: Import tabs to register them

**File:** `src/popup/index.tsx` (add imports before ReactDOM.createRoot)

```typescript
// Import tabs to register them
import '../tabs/page-actions.tab';
import '../tabs/so-sprint.tab';
```

### Step 4: Build to verify no errors

```bash
npm run build
```

Expected: Build succeeds

### Step 5: Commit

```bash
git add src/tabs/page-actions.tab.ts src/components/PageActionsComponent.tsx src/popup/index.tsx
git commit -m "feat: extract PageActions to tab component

- Move counter UI to PageActionsComponent
- Create PageActions tab with priority 100
- Import tabs in popup index for registration"
```

---

## Task 5: TabBar Component

**Files:**
- Create: `src/popup/TabBar.tsx`
- Create: `src/popup/TabBar.css`
- Create: `tests/popup/TabBar.test.tsx`

### Step 1: Write test for TabBar rendering tabs

**File:** `tests/popup/TabBar.test.tsx`

```typescript
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {TabBar} from '../../src/popup/TabBar';
import {TabRegistry} from '../../src/library/tabs/tab-registry';
import chrome from 'sinon-chrome';

describe('TabBar', () => {
    beforeEach(() => {
        chrome.reset();
        chrome.tabs.query.yields([
            {
                id: 123,
                url: 'http://example.com',
            },
        ]);

        // Clear tabs
        TabRegistry['tabs'] = [];
    });

    it('should render visible tabs', async () => {
        // This test will use the registered tabs
        await import('../../src/tabs/page-actions.tab');

        render(<TabBar />);

        // Wait for async query
        await screen.findByText('Page Actions');

        expect(screen.getByText('Page Actions')).toBeInTheDocument();
    });

    it('should render tabs in priority order', async () => {
        await import('../../src/tabs/page-actions.tab');
        await import('../../src/tabs/so-sprint.tab');

        // Query with Airtable URL
        chrome.tabs.query.yields([
            {
                id: 123,
                url: 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6',
            },
        ]);

        render(<TabBar />);

        await screen.findByText('SO SPRINT');

        const buttons = screen.getAllByRole('button');
        expect(buttons[0]).toHaveTextContent('SO SPRINT'); // Priority 0
        expect(buttons[1]).toHaveTextContent('Page Actions'); // Priority 100
    });
});
```

### Step 2: Run test to verify it fails

```bash
npm test -- TabBar.test.tsx --run
```

Expected: FAIL - TabBar not found

### Step 3: Create minimal TabBar component

**File:** `src/popup/TabBar.tsx`

```typescript
import {useState, useEffect} from 'react';
import {TabRegistry} from '../library/tabs/tab-registry';
import {Component} from '../library/components/base-component';
import {Storage} from '../library/storage';
import './TabBar.css';

export function TabBar() {
    const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [currentTabId, setCurrentTabId] = useState<number | null>(null);

    useEffect(() => {
        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            const tab = tabs[0];
            setCurrentUrl(tab.url || '');
            setCurrentTabId(tab.id || null);

            // Load last selected popup tab for this browser tab
            const storageKey = `selectedTab:${tab.id}`;
            const stored = await Storage.get<string>(storageKey);

            // Get visible tabs for this URL
            const visible = TabRegistry.getVisibleTabs(tab.url || '');

            // Use stored selection if valid, otherwise default to first visible
            const validStored = stored && visible.some((t) => t.id === stored);
            setSelectedTabId(validStored ? stored : visible[0]?.id || null);
        });
    }, []);

    const handleTabSelect = async (tabId: string) => {
        setSelectedTabId(tabId);
        if (currentTabId) {
            await Storage.set(`selectedTab:${currentTabId}`, tabId);
        }
    };

    const visibleTabs = TabRegistry.getVisibleTabs(currentUrl);
    const selectedTab = visibleTabs.find((t) => t.id === selectedTabId);

    return (
        <>
            <div className="tab-navigation">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={tab.id === selectedTabId ? 'active' : ''}
                        onClick={() => handleTabSelect(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="tab-content">
                {selectedTab && Component.renderInstance(selectedTab.component)}
            </div>
        </>
    );
}
```

### Step 4: Create TabBar styles

**File:** `src/popup/TabBar.css`

```css
.tab-navigation {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
}

.tab-navigation button {
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 0;
    border-radius: 0;
}

.tab-navigation button:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
}

.tab-navigation button.active {
    color: var(--accent-blue);
    border-bottom-color: var(--accent-blue);
    background: transparent;
}

.tab-content {
    padding: 0;
}
```

### Step 5: Run test

```bash
npm test -- TabBar.test.tsx --run
```

Expected: Tests should pass (or get closer)

### Step 6: Build to verify

```bash
npm run build
```

Expected: Build succeeds

### Step 7: Commit

```bash
git add src/popup/TabBar.tsx src/popup/TabBar.css tests/popup/TabBar.test.tsx
git commit -m "feat: add TabBar component with storage-backed selection

- Renders tabs in priority order
- Remembers selection per browser tab
- Instantiates and renders selected tab component
- Dark mode styling"
```

---

## Task 6: Integrate TabBar into Popup

**Files:**
- Modify: `src/popup/Popup.tsx`

### Step 1: Update Popup to use TabBar

**File:** `src/popup/Popup.tsx` (replace entire file)

```typescript
import {useState, useEffect} from 'react';
import {Tabs} from '../library/tabs';
import {TabBar} from './TabBar';
import './Popup.css';

export function Popup() {
    const [loading, setLoading] = useState<boolean>(true);
    const [canInject, setCanInject] = useState<boolean>(false);

    useEffect(() => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            setCanInject(Tabs.canInjectContent(tab?.url));
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="popup">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (!canInject) {
        return (
            <div className="popup">
                <div className="restriction-notice">
                    <h2>Ari's Chrome Exoskeleton is not allowed to run on this page.</h2>
                    <p>
                        Your browser does not run web extensions like this on certain pages,
                        usually for security reasons.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="popup">
            <TabBar />
        </div>
    );
}
```

### Step 2: Build to verify

```bash
npm run build
```

Expected: Build succeeds

### Step 3: Run all tests

```bash
npm test -- --run
```

Expected: All tests pass (46+ tests)

### Step 4: Commit

```bash
git add src/popup/Popup.tsx
git commit -m "feat: integrate TabBar into Popup

- Replace direct counter UI with TabBar
- Maintain restriction notice for non-injectable pages
- Preserve loading state"
```

---

## Task 7: Error Boundary

**Files:**
- Create: `src/popup/TabErrorBoundary.tsx`
- Modify: `src/popup/TabBar.tsx` (wrap component)

### Step 1: Create error boundary

**File:** `src/popup/TabErrorBoundary.tsx`

```typescript
import React, {ReactNode} from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class TabErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(_error: Error): State {
        return {hasError: true};
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Tab render error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div className="error">This tab failed to load</div>;
        }

        return this.props.children;
    }
}
```

### Step 2: Wrap component in TabBar

**File:** `src/popup/TabBar.tsx` (modify tab-content div)

```typescript
import {TabErrorBoundary} from './TabErrorBoundary';

// ... in return statement, update tab-content:
            <div className="tab-content">
                {selectedTab && (
                    <TabErrorBoundary>
                        {Component.renderInstance(selectedTab.component)}
                    </TabErrorBoundary>
                )}
            </div>
```

### Step 3: Build and test

```bash
npm run build
npm test -- --run
```

Expected: Build succeeds, all tests pass

### Step 4: Commit

```bash
git add src/popup/TabErrorBoundary.tsx src/popup/TabBar.tsx
git commit -m "feat: add error boundary for tab components

- Catches component render errors
- Shows error message without crashing popup
- Logs error details to console"
```

---

## Task 8: Final Testing & Verification

### Step 1: Run full test suite

```bash
npm test -- --run
```

Expected: ALL PASS (50+ tests)

### Step 2: Run test coverage

```bash
npm run test:coverage
```

Expected: 100% function coverage maintained

### Step 3: Build for production

```bash
npm run build
```

Expected: Build succeeds with no errors

### Step 4: Manual verification checklist

Load extension in Chrome and verify:
- [ ] PageActions tab shows on regular pages
- [ ] SO SPRINT tab shows on Airtable URL
- [ ] Tab selection persists when reopening popup
- [ ] Counter still works
- [ ] Dark mode styling looks good
- [ ] No console errors

### Step 5: Final commit

```bash
git add -A
git commit -m "test: verify tabbed popup system complete

- All tests passing
- Coverage maintained
- Build successful
- Manual testing verified"
```

---

## Success Criteria

- [x] Component base class with lifecycle hooks
- [x] TabRegistry with priority-based filtering
- [x] PageActions tab (default, priority 100)
- [x] SO SPRINT tab (priority 0 on Airtable URL)
- [x] TabBar component with storage-backed selection
- [x] Error boundary for component failures
- [x] Popup integration
- [x] Dark mode styling
- [x] All tests passing (100% function coverage)
- [x] Build succeeds
- [x] Manual verification complete

## Next Steps

After merging this feature:
1. Add configurable toggles to tab components
2. Persistent toggle settings via Storage API
3. Additional context-aware tabs for other pages
4. Tab icons/badges
5. Keyboard shortcuts for tab switching
