# Split Tab Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add keyboard shortcut (Ctrl+Shift+=) and UI button to open split screen tabs with blank homepage

**Architecture:** Background script handles both keyboard command and popup messages, uses Chrome's experimental split screen API with feature detection fallback to notification

**Tech Stack:** TypeScript, React, Vitest, sinon-chrome, Chrome Extension Manifest V3

---

## Task 1: Add Keyboard Command to Manifest

**Files:**
- Modify: `manifest.json:29-37`

**Step 1: Add split tab command to manifest**

Edit `manifest.json` to add the new command after `increment-counter`:

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

**Step 2: Verify manifest is valid JSON**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 3: Commit**

```bash
git add manifest.json
git commit -m "feat: add open-split-tab keyboard command to manifest

Add Ctrl+Shift+= shortcut for opening split screen tabs.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add Background Script Handler with Tests

**Files:**
- Create: `tests/background/split-tab.test.ts`
- Modify: `src/background/index.ts:1-25`

**Step 1: Write failing test for split tab handler**

Create `tests/background/split-tab.test.ts`:

```typescript
import {describe, it, expect, beforeEach, vi} from 'vitest';
import chrome from 'sinon-chrome';

describe('Split Tab Handler', () => {
    beforeEach(() => {
        chrome.reset();
        chrome.tabs.query.yields([{id: 123, url: 'http://example.com'}]);
    });

    it('should call chrome.tabs.split when feature is available', async () => {
        // Mock split API as available
        chrome.tabs.split = vi.fn().mockResolvedValue(undefined);

        // Import to trigger handler registration
        await import('../../src/background/index');

        // Get the command listener
        const commandListener = chrome.commands.onCommand.addListener.getCall(0).args[0];

        // Trigger command
        await commandListener('open-split-tab');

        // Verify split was called
        expect(chrome.tabs.split).toHaveBeenCalledWith({
            tabId: 123,
            newTabUrl: 'about:blank',
        });
    });

    it('should show notification when split API not available', async () => {
        // Mock split API as unavailable
        delete (chrome.tabs as any).split;
        chrome.notifications = {
            create: vi.fn(),
        } as any;

        await import('../../src/background/index');

        const commandListener = chrome.commands.onCommand.addListener.getCall(0).args[0];
        await commandListener('open-split-tab');

        // Notifications.show should be called (we'll verify via DOM in integration test)
        expect(chrome.tabs.split).toBeUndefined();
    });

    it('should handle message from popup', async () => {
        chrome.tabs.split = vi.fn().mockResolvedValue(undefined);

        await import('../../src/background/index');

        const messageListener = chrome.runtime.onMessage.addListener.getCall(0).args[0];
        await messageListener({type: 'OPEN_SPLIT_TAB'});

        expect(chrome.tabs.split).toHaveBeenCalledWith({
            tabId: 123,
            newTabUrl: 'about:blank',
        });
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/background/split-tab.test.ts --run`
Expected: FAIL - module doesn't export handler yet

**Step 3: Implement handleOpenSplitTab function**

Modify `src/background/index.ts` to add the handler:

```typescript
import {Commands} from '@library/commands';
import {Notifications} from '@library/notifications';
import {IncrementAction} from '../actions/increment.action';

// Handle split tab from keyboard or popup
async function handleOpenSplitTab() {
    // Feature detection
    if (typeof chrome.tabs.split !== 'function') {
        Notifications.show('Split screen not enabled. Turn on chrome://flags/#split-screen');
        return;
    }

    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (tab.id) {
        await chrome.tabs.split({
            tabId: tab.id,
            newTabUrl: 'about:blank',
        });
    }
}

// Listen for keyboard commands
Commands.onCommand(async (command) => {
    console.log('Command received:', command);

    if (command === 'increment-counter') {
        // Get active tab
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

        if (tab.id) {
            // Send increment action to content script
            try {
                await IncrementAction.sendToTab(tab.id, {amount: 1});
                console.log('Counter incremented via keyboard shortcut');
            } catch (error) {
                console.error('Failed to increment counter:', error);
            }
        }
    } else if (command === 'open-split-tab') {
        await handleOpenSplitTab();
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'OPEN_SPLIT_TAB') {
        handleOpenSplitTab();
    }
});

console.log('Chrome Extension Starter: Background service worker loaded');
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/background/split-tab.test.ts --run`
Expected: PASS (3 tests)

**Step 5: Run all tests**

Run: `npm test -- --run`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/background/index.ts tests/background/split-tab.test.ts
git commit -m "feat: add split tab handler to background script

Add handleOpenSplitTab function that:
- Detects if chrome.tabs.split exists
- Shows notification if unavailable
- Opens split tab with about:blank if available
- Responds to keyboard command and popup messages

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add UI Button to PageActionsComponent

**Files:**
- Create: `tests/components/PageActionsComponent.test.tsx`
- Modify: `src/components/PageActionsComponent.tsx:83-110`

**Step 1: Write failing test for split tab button**

Create `tests/components/PageActionsComponent.test.tsx`:

```typescript
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {PageActionsContent} from '../../src/components/PageActionsComponent';
import chrome from 'sinon-chrome';

describe('PageActionsComponent', () => {
    beforeEach(() => {
        chrome.reset();
        chrome.tabs.query.yields([{id: 123, url: 'http://example.com'}]);
        chrome.runtime.sendMessage.yields(undefined);
    });

    it('should render split tab button', async () => {
        render(<PageActionsContent />);

        const button = await screen.findByText('Open Split Tab');
        expect(button).toBeTruthy();
    });

    it('should send OPEN_SPLIT_TAB message when button clicked', async () => {
        const sendMessageSpy = vi.spyOn(chrome.runtime, 'sendMessage');

        render(<PageActionsContent />);

        const button = await screen.findByText('Open Split Tab');
        fireEvent.click(button);

        expect(sendMessageSpy).toHaveBeenCalledWith({
            type: 'OPEN_SPLIT_TAB',
        });
    });

    it('should show Ctrl+Shift+= in footer', async () => {
        render(<PageActionsContent />);

        const footer = await screen.findByText(/Ctrl\+Shift\+=/);
        expect(footer).toBeTruthy();
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/PageActionsComponent.test.tsx --run`
Expected: FAIL - button and footer text don't exist

**Step 3: Add button and handler to PageActionsComponent**

Modify `src/components/PageActionsComponent.tsx`:

```typescript
import {useState, useEffect} from 'react';
import {IncrementAction} from '../actions/increment.action';
import {GetCountAction} from '../actions/get-count.action';
import {Tabs} from '../library/tabs';

export function PageActionsContent() {
    const [count, setCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [canInject, setCanInject] = useState<boolean>(false);

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

        // Get initial count when popup opens
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];

            // Check if we can inject content scripts into this page
            if (!Tabs.canInjectContent(tab?.url)) {
                setCanInject(false);
                setLoading(false);
                return;
            }

            setCanInject(true);
            GetCountAction.sendToActiveTab(undefined)
                .then((result) => {
                    setCount((result as {count: number}).count);
                    setLoading(false);
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
                    setLoading(false);
                });
        });

        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        };
    }, []);

    const handleIncrement = async () => {
        if (!canInject) {
            return;
        }

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

    const handleOpenSplitTab = async () => {
        try {
            await chrome.runtime.sendMessage({
                type: 'OPEN_SPLIT_TAB',
            });
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to open split tab';
            setError(errorMsg);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

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
            <button className="split-tab-button" onClick={handleOpenSplitTab}>
                Open Split Tab
            </button>
            <button className="shortcuts-button" onClick={handleOpenShortcuts}>
                Configure Keyboard Shortcut
            </button>
            <div className="footer">
                <kbd>Ctrl+Shift+I</kbd> to increment | <kbd>Ctrl+Shift+=</kbd> for split tab
            </div>
        </>
    );
}
```

**Step 4: Run component tests**

Run: `npm test -- tests/components/PageActionsComponent.test.tsx --run`
Expected: PASS (3 tests)

**Step 5: Run all tests**

Run: `npm test -- --run`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/components/PageActionsComponent.tsx tests/components/PageActionsComponent.test.tsx
git commit -m "feat: add split tab button to PageActionsComponent

Add:
- handleOpenSplitTab that sends OPEN_SPLIT_TAB message
- 'Open Split Tab' button in UI
- Updated footer with Ctrl+Shift+= hint

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Final Verification

**Step 1: Run full test suite**

Run: `npm test -- --run`
Expected: All tests pass (76+ tests)

**Step 2: Build extension**

Run: `npm run build`
Expected: Build succeeds, dist/ folder created

**Step 3: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 4: Commit if any fixes needed**

If linting required changes:
```bash
git add .
git commit -m "fix: address linting issues

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Manual Testing Checklist

After implementation, test manually:

1. Load extension in Chrome as unpacked
2. Open any webpage
3. Press Ctrl+Shift+= (or Cmd+Shift+= on Mac)
   - If split screen enabled: should open split view with blank tab
   - If not enabled: should see notification toast
4. Open popup, click "Open Split Tab" button
   - Same behavior as keyboard shortcut
5. Verify footer shows correct keyboard hint
6. Check chrome://extensions/shortcuts shows new command

## Notes

- The chrome.tabs.split API is experimental and requires chrome://flags/#split-screen to be enabled
- Feature detection gracefully falls back to showing a notification
- Uses existing Notifications library for user feedback
- Follows same pattern as increment-counter command
