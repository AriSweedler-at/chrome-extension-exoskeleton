# Tab Enablement Library Feature

**Date:** 2026-01-22
**Status:** Approved

## Overview

Refactor the GitHub autoscroll enablement mechanism into a reusable library feature. Any tab can opt into enablement functionality by setting `enablementToggle: true` in their registration. The library handles all UI, state management, and storage automatically.

## Current State

GitHub autoscroll implements its own enablement:
- Custom state management in `GitHubAutoscrollComponent.tsx` (~60 lines)
- Storage key: `exorun-github-autoscroll`
- Manual checkbox UI rendering
- Session toggle coordination logic
- Content script checks storage before auto-running

## Goals

1. Make enablement a library feature, not tab-specific code
2. Minimize code required in individual tab components
3. Maintain current behavior for GitHub autoscroll
4. Enable easy adoption for new tabs (e.g., Spinnaker)

## Design

### TabRegistry Enhancement

**Interface Change:**
```typescript
export interface TabRegistration {
    id: string;
    label: string;
    component: ComponentType;
    getPriority: (url: string) => number;
    enablementToggle?: boolean;  // NEW: defaults to false
}
```

When `enablementToggle: true`, the library automatically provides:
- Storage management using `exorun-${tabId}` key pattern
- Toggle UI at bottom of tab content
- React hook for reading enabled state
- Session coordination (toggle affects current tab immediately)

### Library Components

**Hook: `useTabEnablement(tabId: string)`**
```typescript
export function useTabEnablement(tabId: string) {
    const [enabled, setEnabled] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);

    // Load from storage on mount
    useEffect(() => {
        Storage.get<boolean>(`exorun-${tabId}`).then(value => {
            setEnabled(value === undefined ? true : value);
            setLoading(false);
        });
    }, [tabId]);

    const updateEnabled = async (newValue: boolean) => {
        await Storage.set(`exorun-${tabId}`, newValue);
        setEnabled(newValue);
    };

    return { enabled, loading, setEnabled: updateEnabled };
}
```

**Component: `TabEnablementSection`**
- Renders checkbox UI with label "Enable on page load:"
- Styled with border-top divider, flex layout
- Uses `useTabEnablement` internally
- Coordinates with current session (sends toggle message if needed)
- Matches existing GitHub autoscroll UI pattern

**TabBar Integration:**
```typescript
// In TabBar.tsx
<div className="tab-content">
    {selectedTab && (
        <TabErrorBoundary>
            <selectedTab.component />

            {/* Automatic injection by library */}
            {selectedTab.enablementToggle && (
                <TabEnablementSection tabId={selectedTab.id} />
            )}
        </TabErrorBoundary>
    )}
</div>
```

### Tab Component Usage

**Registration:**
```typescript
// github-autoscroll.tab.tsx
TabRegistry.register({
    id: 'github-autoscroll',
    label: 'Autoscroll',
    component: GitHubAutoscrollComponent,
    getPriority: (url: string) => { /* ... */ },
    enablementToggle: true,  // Enable the feature
});
```

**Component (optional usage):**
```typescript
// GitHubAutoscrollComponent.tsx
import { useTabEnablement } from '../library/tabs/use-tab-enablement';

export function GitHubAutoscrollContent() {
    const { enabled } = useTabEnablement('github-autoscroll');
    // Use if needed for session coordination
    // Otherwise ignore - library handles everything
}
```

**No UI code needed** - library automatically injects the toggle at the bottom.

### Content Script Pattern

Content scripts check enablement before running:
```typescript
const enabled = await Storage.get<boolean>('exorun-github-autoscroll');
const shouldRun = enabled === undefined ? true : enabled;

if (shouldRun) {
    // Initialize tab functionality
}
```

## Migration: GitHub Autoscroll

**Remove from `GitHubAutoscrollComponent.tsx`:**
- `autoRunEnabled` state (line 15)
- `handleAutoRunToggle` function (lines 78-110)
- Auto-run preference UI section (lines 154-179)
- Storage.get/set calls for `exorun-github-autoscroll` (lines 22-24, 80-82)

**Add to `github-autoscroll.tab.tsx`:**
- `enablementToggle: true` in registration

**Keep:**
- Current session toggle logic (active/inactive button)
- Message passing for TOGGLE action
- Content script storage check pattern

Result: ~50 lines removed, enablement UI provided automatically by library.

## New Feature: Spinnaker Tab

**Files to create:**
1. `src/tabs/spinnaker.tab.tsx` - Registration with `enablementToggle: true`
2. `src/components/SpinnakerComponent.tsx` - Component implementation
3. `src/library/spinnaker.ts` - URL detection helper

**URL Detection:**
- Match: `https://spinnaker.k8s.shadowbox.cloud/#/search`
- Match: `https://spinnaker.k8s.alpha-shadowbox.cloud/#/search`

**Registration:**
```typescript
TabRegistry.register({
    id: 'spinnaker',
    label: 'Spinnaker',
    component: SpinnakerComponent,
    getPriority: (url) => isSpinnakerSearchPage(url) ? 0 : Number.MAX_SAFE_INTEGER,
    enablementToggle: true,
});
```

Enablement works automatically - no additional code needed.

## Implementation Order

1. Create `useTabEnablement` hook
2. Create `TabEnablementSection` component
3. Update `TabRegistry` interface
4. Update `TabBar` to inject section automatically
5. Migrate GitHub autoscroll
6. Test GitHub autoscroll migration
7. Create Spinnaker tab
8. Test Spinnaker tab

## Testing Strategy

- Unit tests for `useTabEnablement` hook
- Unit tests for `TabEnablementSection` component
- Integration tests for TabBar auto-injection
- Update existing GitHub autoscroll tests
- Add Spinnaker tab tests

## Benefits

1. **Consistency** - All tabs use same enablement pattern
2. **Simplicity** - Tab components need 1 line (`enablementToggle: true`)
3. **Maintainability** - Enablement logic in one place
4. **Discoverability** - Feature is obvious in TabRegistry
5. **Flexibility** - Tabs can opt-in or opt-out easily
