# Split Tab Feature Design

**Date**: 2026-01-16
**Status**: Approved

## Overview

Add keyboard shortcut and UI button to open a split screen tab with a blank homepage, allowing quick navigation while keeping the current page visible.

## Requirements

- Keyboard shortcut: `Ctrl+Shift+=` (appears as `Ctrl+Shift++` to users)
- Button in PageActions tab UI
- Open `about:blank` by default (configurable later)
- Show toast notification if split screen feature not enabled in Chrome
- Works similar to Arc browser's split tab feature

## Architecture

### 1. Manifest Changes

Add new command to `manifest.json`:

```json
"commands": {
  "increment-counter": {
    "suggested_key": {
      "default": "Ctrl+Shift+I",
      "mac": "Command+Shift+I"
    },
    "description": "Increment page action counter"
  },
  "open-split-tab": {
    "suggested_key": {
      "default": "Ctrl+Shift+=",
      "mac": "Command+Shift+="
    },
    "description": "Open split tab with homepage"
  }
}
```

**Note**: Use `=` as the key (unshifted version of `+`). Chrome's command API expects unshifted keys.

### 2. Background Script Handler

Add handler in `src/background/index.ts`:

```typescript
// Handle keyboard command
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-split-tab') {
    handleOpenSplitTab();
  }
});

// Handle message from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'OPEN_SPLIT_TAB') {
    handleOpenSplitTab();
  }
});

async function handleOpenSplitTab() {
  // Feature detection
  if (typeof chrome.tabs.split !== 'function') {
    Notifications.show('Split screen not enabled. Turn on chrome://flags/#split-screen');
    return;
  }

  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  await chrome.tabs.split({
    tabId: tab.id,
    newTabUrl: 'about:blank'
  });
}
```

### 3. Chrome Split Screen API

Uses experimental Chrome API:

```typescript
chrome.tabs.split({
  tabId: currentTabId,
  newTabUrl: 'about:blank'
})
```

Creates split view:
- **Left side**: Current tab (stays on current page)
- **Right side**: New tab with specified URL, focused with address bar active

**Feature Detection**: Check `typeof chrome.tabs.split === 'function'`

**Fallback**: Show notification if not available: "Split screen not enabled. Turn on chrome://flags/#split-screen"

### 4. UI Changes - PageActionsComponent

Add button and handler:

```tsx
const handleOpenSplitTab = async () => {
  try {
    await chrome.runtime.sendMessage({
      type: 'OPEN_SPLIT_TAB'
    });
  } catch (err) {
    setError('Failed to open split tab');
  }
};

// In render:
<button className="split-tab-button" onClick={handleOpenSplitTab}>
  Open Split Tab
</button>
```

Update footer with keyboard hint:

```tsx
<div className="footer">
    <kbd>Ctrl+Shift+I</kbd> to increment | <kbd>Ctrl+Shift+=</kbd> for split tab
</div>
```

## Testing Strategy

- Mock `chrome.tabs.split` with sinon-chrome
- Test feature detection (function exists vs doesn't exist)
- Test notification shown when feature unavailable
- Test split tab called with correct parameters
- Test keyboard command triggers handler
- Test popup button sends correct message

## Future Enhancements

- Make homepage URL configurable (default: `about:blank`)
- Add storage setting for user's preferred split tab URL
- Support multiple homepage options (blank, new tab, custom URL)

## Technical Notes

- This is a **background-only action** (uses `chrome.tabs` API, not content script messaging)
- Different from `IncrementAction` which sends messages to content scripts
- Requires Chrome's experimental split screen feature enabled in `chrome://flags/#split-screen`
