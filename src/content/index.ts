import {IncrementAction} from '../actions/increment.action';
import {GetCountAction} from '../actions/get-count.action';

// Context state for this content script
const context = {
    count: 0,
};

// Register action handlers with context
IncrementAction.setContext(context);
IncrementAction.handle(
    async (
        payload: {amount: number},
        _sender: chrome.runtime.MessageSender,
        ctx: {count: number},
    ) => {
        ctx.count += payload.amount;

        // Broadcast count change to popup (if open)
        chrome.runtime.sendMessage({
            type: 'COUNT_UPDATED',
            count: ctx.count,
        }).catch(() => {
            // Popup might not be open, ignore error
        });

        return {count: ctx.count};
    },
);

GetCountAction.setContext(context);
GetCountAction.handle(
    async (
        _payload: void,
        _sender: chrome.runtime.MessageSender,
        ctx: {count: number},
    ) => {
        return {count: ctx.count};
    },
);

// Reset count on page load
window.addEventListener('load', () => {
    context.count = 0;
});

console.log('Chrome Extension Starter: Content script loaded');

// GitHub Autoscroll integration
import {initializeAutoScroll, isGitHubPRChangesPage} from '../library/github-autoscroll';
import {Storage} from '../library/storage';
import {Notifications} from '../library/notifications';

// GitHub Autoscroll message handlers
chrome.runtime.onMessage.addListener(
    (
        message: {type: string},
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: any) => void,
    ) => {
        if (message.type === 'GITHUB_AUTOSCROLL_GET_STATUS') {
            const active = typeof (window as any).__ghAutoScrollStop === 'function';
            sendResponse({active});
            return true;
        }

        if (message.type === 'GITHUB_AUTOSCROLL_TOGGLE') {
            const currentlyActive = typeof (window as any).__ghAutoScrollStop === 'function';

            if (currentlyActive) {
                // Stop autoscroll
                (window as any).__ghAutoScrollStop();
                Notifications.show('GitHub PR Autoscroll disabled');
                sendResponse({active: false});
            } else {
                // Start autoscroll
                const stopFn = initializeAutoScroll();
                if (stopFn) {
                    (window as any).__ghAutoScrollStop = stopFn;
                    Notifications.show('GitHub PR Autoscroll enabled');
                    sendResponse({active: true});
                } else {
                    Notifications.show('No files found. Make sure you\'re on a GitHub PR page.');
                    sendResponse({active: false});
                }
            }
            return true;
        }

        return false;
    },
);

// Auto-run on GitHub PR changes pages
window.addEventListener('load', async () => {
    if (!isGitHubPRChangesPage(window.location.href)) {
        return;
    }

    // Check if autoscroll is already running to prevent race condition
    if (typeof (window as any).__ghAutoScrollStop === 'function') {
        return;
    }

    const exorun = await Storage.get<boolean>('exorun-github-autoscroll');
    const shouldAutoRun = exorun === undefined ? true : exorun;

    if (shouldAutoRun) {
        const stopFn = initializeAutoScroll();
        if (stopFn) {
            (window as any).__ghAutoScrollStop = stopFn;
            Notifications.show('GitHub PR Autoscroll enabled');
        }
    }
});
