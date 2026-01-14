# Tabbed Popup System Design

**Date:** 2026-01-13
**Status:** Approved

## Overview

Design for a priority-based tab system in the popup with context-aware tabs that show/hide based on the current page URL. Tabs register themselves dynamically and compute their own priority to determine visibility and ordering.

## Goals

1. Add tabbed navigation to popup window
2. Show context-specific tabs (e.g., "SO SPRINT" on specific Airtable page)
3. Remember last selected tab per browser tab
4. Support unlimited tabs with no performance impact (tabs only load when visible)
5. Test-driven implementation with full coverage

## Architecture Overview

### Core Classes

**1. Component (Abstract Base Class)**
- Location: `src/library/components/base-component.ts`
- Responsible for rendering React elements
- Optional lifecycle: `onMount()`, `onUnmount()`
- Abstract `render(): ReactElement`

**2. TabRegistry (Registration System)**
- Location: `src/library/tabs/tab-registry.ts`
- Maintains list of all registered tabs
- Filters and sorts tabs by priority for given URL
- No class instances - static registry pattern

**3. TabBar (React Component)**
- Location: `src/popup/TabBar.tsx`
- Queries active tab URL
- Gets visible tabs from registry
- Renders tab navigation
- Manages selected tab with persistent storage

### Data Flow

1. Popup opens → TabBar queries current URL
2. Each registered tab computes priority for that URL
3. Tabs filtered (exclude MAX_SAFE_INTEGER) and sorted (lowest first)
4. Restore last selected tab for this browser tab, or use first visible
5. Selected tab's Component instantiated and rendered
6. Tab selection stored: `selectedTab:{browserTabId} → tabId`

## Tab Registration System

### Registration Interface

```typescript
interface TabRegistration {
  id: string;                          // Unique identifier
  label: string;                       // Display name
  component: typeof Component;         // Component class
  getPriority: (url: string) => number; // Priority calculator
}
```

### Priority System

- `Number.MAX_SAFE_INTEGER` = Hidden (don't show this tab)
- `0` = Highest priority (leftmost, auto-selected)
- `100` = Default tab priority
- Lower number = higher priority (earlier in tab order)
- Lowest priority tab gets auto-selected

### TabRegistry Implementation

```typescript
class TabRegistry {
  private static tabs: TabRegistration[] = [];

  static register(config: TabRegistration): void {
    // Throw if duplicate ID
    if (this.tabs.some(t => t.id === config.id)) {
      throw new Error(`Tab ID '${config.id}' already registered`);
    }
    this.tabs.push(config);
  }

  static getVisibleTabs(url: string): Array<TabRegistration & {priority: number}> {
    return this.tabs
      .map(tab => ({ ...tab, priority: tab.getPriority(url) }))
      .filter(tab => tab.priority !== Number.MAX_SAFE_INTEGER)
      .sort((a, b) => a.priority - b.priority);
  }
}
```

### Example Tab File

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
      return 0;  // Highest priority
    }
    return Number.MAX_SAFE_INTEGER;  // Hidden
  }
});
```

## Component Base Class

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

**Design rationale:**
- Components are classes, not React components (avoids hook limitations)
- Lifecycle methods enable stateful side effects
- `renderInstance` handles instantiation + lifecycle + render
- Fresh instance created per render

## TabBar Component

**File:** `src/popup/TabBar.tsx`

```typescript
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
      const validStored = stored && visible.some(t => t.id === stored);
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
  const selectedTab = visibleTabs.find(t => t.id === selectedTabId);

  return (
    <>
      <div className="tab-navigation">
        {visibleTabs.map(tab => (
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
        {selectedTab && (
          <TabErrorBoundary>
            {Component.renderInstance(selectedTab.component)}
          </TabErrorBoundary>
        )}
      </div>
    </>
  );
}
```

## Popup Integration

**Updated Popup.tsx:**

```typescript
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
    return <RestrictionNotice />;
  }

  return (
    <div className="popup">
      <TabBar />
    </div>
  );
}
```

## Error Handling

### Error Scenarios

1. **No tabs visible:** Fallback to empty state (shouldn't happen with default tab)
2. **Component render throws:** Error boundary catches, shows error message
3. **Storage API fails:** Fall back to first visible tab
4. **Duplicate tab IDs:** Throw error at registration time

### Error Boundary

```typescript
class TabErrorBoundary extends React.Component {
  state = { hasError: false };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Tab render error:', error, errorInfo);
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return <div className="error">This tab failed to load</div>;
    }
    return this.props.children;
  }
}
```

## Testing Strategy

### Test Coverage Requirements

**1. TabRegistry Tests** (`tests/library/tab-registry.test.ts`):
- ✓ Register single tab
- ✓ Register multiple tabs
- ✓ Get visible tabs filters by priority
- ✓ Tabs sorted by priority (lowest first)
- ✓ Duplicate ID throws error
- ✓ Priority MAX_SAFE_INTEGER excludes tab

**2. Component Tests** (`tests/library/base-component.test.ts`):
- ✓ Component.render() must be implemented
- ✓ Component.renderInstance() calls onMount
- ✓ Component lifecycle hooks called in order
- ✓ Render returns valid ReactElement

**3. TabBar Tests** (`tests/popup/TabBar.test.ts`):
- ✓ Renders visible tabs in priority order
- ✓ Selects highest priority tab by default
- ✓ Tab selection persists per browser tab ID
- ✓ Switches tabs on click
- ✓ Falls back when stored tab not visible
- ✓ Shows content from selected tab's component

**4. Integration Tests** (`tests/tabs/so-sprint.test.ts`):
- ✓ SO SPRINT tab registers successfully
- ✓ Priority 0 on exact Airtable URL match
- ✓ Priority MAX_SAFE_INTEGER on other URLs
- ✓ Component renders "HELLO, WORLD" message

### Test Philosophy
- TDD: Write tests before implementation
- Unit test each class independently
- Integration test tab registration flow
- Mock chrome APIs with sinon-chrome

## File Structure

```
src/
├── library/
│   ├── components/
│   │   └── base-component.ts       # Component abstract class
│   └── tabs/
│       └── tab-registry.ts         # TabRegistry implementation
├── popup/
│   ├── TabBar.tsx                  # TabBar component
│   ├── TabBar.css                  # Tab styling
│   └── Popup.tsx                   # Updated to use TabBar
└── tabs/
    ├── page-actions.tab.ts         # Default tab (existing counter UI)
    └── so-sprint.tab.ts            # SO SPRINT tab (initial implementation)

tests/
├── library/
│   ├── base-component.test.ts
│   └── tab-registry.test.ts
├── popup/
│   └── TabBar.test.ts
└── tabs/
    └── so-sprint.test.ts
```

## Implementation Order

1. **Component base class** + tests
2. **TabRegistry** + tests
3. **Default PageActions tab** (convert existing UI)
4. **SO SPRINT tab** + tests
5. **TabBar component** + tests
6. **Error boundary** + tests
7. **Popup integration**
8. **Styling**

## Future Enhancements

After initial implementation:
- Add configurable toggles to tab components
- Persistent toggle settings via Storage API
- Additional context-aware tabs for other pages
- Tab icons/badges
- Keyboard shortcuts for tab switching

## Success Criteria

- [ ] All tests passing (100% function coverage)
- [ ] SO SPRINT tab shows on exact Airtable URL
- [ ] Tab selection persists per browser tab
- [ ] No performance impact from unused tabs
- [ ] Clean, maintainable tab registration pattern
- [ ] Easy to add new tabs (single file per tab)
