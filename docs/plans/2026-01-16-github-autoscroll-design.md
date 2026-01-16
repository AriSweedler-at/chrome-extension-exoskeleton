# GitHub Autoscroll Feature Design

**Date:** 2026-01-16
**Status:** Approved

## Overview

Integrate the GitHub PR autoscroll bookmarklet into the Chrome extension. The feature automatically scrolls to the next unviewed file when a file is marked as "Viewed" on GitHub PR changes pages.

## Goals

- Auto-run on GitHub PR changes pages (configurable)
- Show "autoscroll" tab in popup for status and manual control
- Display toast notification when activated
- Maintain existing bookmarklet functionality

## Architecture

### Components

1. **GitHub Autoscroll Tab** - Shows active/inactive status with toggle button
2. **Content Script Logic** - Runs autoscroll code on GitHub PR pages
3. **Configuration Storage** - Stores user preference for auto-run (default: enabled)
4. **URL Matching** - Detects GitHub PR changes pages

### Data Flow

```
Page Load → Content Script
           ↓
Check URL: github.com/*/pull/*/changes?
           ↓
If match → Read storage: exorun-github-autoscroll
           ↓
If true (default) → Initialize autoscroll + toast
If false → Wait for manual toggle from popup
           ↓
Tab appears in popup → Shows status + toggle button
```

## URL Detection

**Supported Pattern:**
- `github.com/{owner}/{repo}/pull/{number}/changes`

**Detection Logic:**
```typescript
function isGitHubPRChangesPage(url: string): boolean {
  const parts = url.split('/');
  return parts[2] === 'github.com' &&
    parts.length >= 7 &&
    parts[5] === 'pull' &&
    !isNaN(parseInt(parts[6])) &&
    parts[7] === 'changes';
}
```

## Configuration

**Storage Key:** `exorun-github-autoscroll`
**Type:** `boolean`
**Default:** `true`
**Storage API:** `chrome.storage.sync` (persists and syncs across devices)

The "exorun" prefix indicates extension auto-run features.

## Communication Protocol

### Content Script → Popup

Content script listens for messages:
- `{ type: 'GITHUB_AUTOSCROLL_GET_STATUS' }` → Returns `{ active: boolean }`
- `{ type: 'GITHUB_AUTOSCROLL_TOGGLE' }` → Starts/stops autoscroll, returns new status

### State Management

Global state stored in `window.__ghAutoScrollStop`:
- `undefined` → Autoscroll inactive
- `Function` → Autoscroll active, function stops it

## Tab Behavior

**Visibility:**
- Tab appears when on GitHub PR changes page (priority: 0)
- Hidden on all other pages (priority: Number.MAX_SAFE_INTEGER)

**UI Elements:**
- Status indicator: "Active ✓" or "Inactive"
- Toggle button: "Disable" or "Enable"

**Initialization:**
1. Query content script for current status
2. Display status and appropriate button
3. On button click → send toggle message → update UI

## Autoscroll Functionality

Adapted from existing bookmarklet:

1. **On initialization:**
   - Inject CSS for flash animation
   - Add click listener for "Viewed" buttons
   - Scroll to first unviewed file with flash effect
   - Show toast: "gh autoscroll enabled"

2. **On file marked as viewed:**
   - Find next unviewed file
   - Scroll to center it at top of viewport
   - Flash white border animation
   - If all files viewed → toast: "All files reviewed! 🎉"

3. **On disable:**
   - Remove click listener
   - Remove injected CSS
   - Clear global state
   - Show toast: "GitHub PR auto-scroll disabled"

## File Structure

### New Files

- `src/tabs/github-autoscroll.tab.ts` - Tab registration with URL matching
- `src/components/GitHubAutoscrollComponent.tsx` - Tab UI (status + toggle)
- `src/library/github-autoscroll.ts` - Core autoscroll logic (adapted from bookmarklet)
- `src/tabs/index.ts` - Auto-import all tabs (manually maintained for now)

### Modified Files

- `src/content/index.ts` - Add autoscroll initialization on page load
- `src/popup/index.tsx` - Import `../tabs` instead of individual tab files

## Future Enhancements

- Auto-generate `src/tabs/index.ts` from directory contents
- Support `/files` URL pattern in addition to `/changes`
- Settings UI to configure auto-run behavior
- Statistics tracking (files reviewed per session)

## Implementation Notes

- Reuse existing bookmarklet code with minimal changes
- Maintain compatibility with bookmarklet's notification system
- Follow existing tab registration pattern (see `so-sprint.tab.ts`)
- Use existing `Notifications` library for toast messages
- Tab component should extend `Component` base class
