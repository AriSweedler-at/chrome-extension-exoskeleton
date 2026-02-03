import {IncrementAction} from '../actions/increment.action';
import {GetCountAction} from '../actions/get-count.action';
import {CopyRichLinkAction, CopyRichLinkPayload} from '../actions/copy-rich-link.action';
import {HandlerRegistry} from '../library/richlink/handlers';
import {Clipboard} from '../library/clipboard';
import {Notifications} from '../library/notifications';
import {CopyCounter} from '../library/richlink/copy-counter';

// Format cycling for keyboard shortcut
function getNextFormatIndex(totalFormats: number): number {
    const CACHE_KEY = 'richlink-last-copy';
    const CACHE_EXPIRY_MS = 1000;

    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) {
            return 0;
        }

        const data = JSON.parse(cached);
        const isExpired = Date.now() - data.timestamp > CACHE_EXPIRY_MS;

        if (isExpired) {
            localStorage.removeItem(CACHE_KEY);
            return 0;
        }

        // Cycle to next format
        const nextIndex = (data.formatIndex + 1) % totalFormats;
        return nextIndex;
    } catch {
        return 0;
    }
}

function cacheFormatIndex(formatIndex: number): void {
    const CACHE_KEY = 'richlink-last-copy';
    const data = {
        timestamp: Date.now(),
        formatIndex,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

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

// Register CopyRichLinkAction handler
CopyRichLinkAction.handle(async (payload: CopyRichLinkPayload, _sender, _context) => {
    const formats = await HandlerRegistry.getAllFormats(payload.url);

    // Check if we're cycling (within 1s of previous copy)
    const isCycling = (() => {
        const CACHE_KEY = 'richlink-last-copy';
        const CACHE_EXPIRY_MS = 1000;
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return false;
            const data = JSON.parse(cached);
            return Date.now() - data.timestamp <= CACHE_EXPIRY_MS;
        } catch {
            return false;
        }
    })();

    // Get format index
    const formatIndex = payload.formatIndex !== undefined
        ? payload.formatIndex
        : getNextFormatIndex(formats.length);

    const format = formats[formatIndex];

    // Copy to clipboard
    await Clipboard.write(format.text, format.html);

    // Only increment counter on first copy (not when cycling)
    if (!isCycling) {
        await CopyCounter.increment();
    }

    // Build preview of next cycles (show next 2-3 formats)
    const nextFormats: string[] = [];
    if (formats.length > 1) {
        for (let i = 1; i <= Math.min(3, formats.length - 1); i++) {
            const nextIndex = (formatIndex + i) % formats.length;
            nextFormats.push(formats[nextIndex].label);
        }
    }
    const preview = nextFormats.length > 0 ? `Next: ${nextFormats.join(' → ')}` : undefined;

    // Determine if this is a fallback handler (PageTitle or RawURL)
    const isFallback = format.label === 'Page Title' || format.label === 'Raw URL';
    const opacity = isFallback ? 0.6 : 1;

    // Show notification with format indicator
    const formatInfo = formats.length > 1 ? ` [${formatIndex + 1}/${formats.length}]` : '';
    const message = `Copied${formatInfo}\n${format.label}`;

    Notifications.showRichNotification(message, 'success', 3000, {
        replace: isCycling, // Replace immediately when cycling
        opacity: opacity, // Paler for fallbacks
        preview: preview, // Show next cycles
    });

    // Cache format index for cycling
    if (payload.formatIndex === undefined) {
        cacheFormatIndex(formatIndex);
    }

    return {success: true, formatIndex, totalFormats: formats.length};
});

// Reset count on page load
window.addEventListener('load', () => {
    context.count = 0;
});

console.log('Chrome Extension Starter: Content script loaded');

// GitHub Autoscroll integration
import {initializeAutoScroll, isGitHubPRChangesPage} from '../library/github-autoscroll';
import {Storage} from '../library/storage';

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
                const stopFn = initializeAutoScroll(true); // Enable debug mode
                if (stopFn) {
                    (window as any).__ghAutoScrollStop = stopFn;
                    Notifications.show('GitHub PR Autoscroll enabled');
                    sendResponse({active: true});
                } else {
                    Notifications.show('No files found. Make sure you\'re on a GitHub PR changes page.');
                    sendResponse({active: false});
                }
            }
            return true;
        }

        return false;
    },
);

// Auto-run on GitHub PR changes pages
async function tryAutoRunAutoscroll() {
    console.log('[Auto-run] Checking URL:', window.location.href);

    if (!isGitHubPRChangesPage(window.location.href)) {
        console.log('[Auto-run] Not a GitHub PR changes page, skipping');
        return;
    }

    console.log('[Auto-run] On GitHub PR changes page');

    // Check if autoscroll is already running to prevent race condition
    if (typeof (window as any).__ghAutoScrollStop === 'function') {
        console.log('[Auto-run] Autoscroll already running, skipping');
        return;
    }

    const exorun = await Storage.get<boolean>('exorun-github-autoscroll');
    console.log('[Auto-run] Storage value for exorun-github-autoscroll:', exorun);
    const shouldAutoRun = exorun === undefined ? true : exorun;
    console.log('[Auto-run] Should auto-run:', shouldAutoRun);

    if (shouldAutoRun) {
        console.log('[Auto-run] Starting autoscroll...');
        const stopFn = initializeAutoScroll(true); // Enable debug mode
        if (stopFn) {
            (window as any).__ghAutoScrollStop = stopFn;
            Notifications.show('GitHub PR Autoscroll enabled');
            console.log('[Auto-run] Autoscroll enabled successfully');
        } else {
            console.log('[Auto-run] initializeAutoScroll returned null (no files found)');
        }
    } else {
        console.log('[Auto-run] Auto-run disabled in settings');
    }
}

// GitHub is a SPA, so we need to handle both initial load and navigation
// 1. Check on initial load
console.log('[Auto-run] Content script loaded, waiting for DOM...');
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[Auto-run] DOMContentLoaded event fired');
        setTimeout(tryAutoRunAutoscroll, 500); // Wait for GitHub to render
    });
} else {
    console.log('[Auto-run] DOM already ready');
    setTimeout(tryAutoRunAutoscroll, 500); // Wait for GitHub to render
}

// 2. Listen for SPA navigation (GitHub uses History API)
let lastUrl = window.location.href;
new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        console.log('[Auto-run] URL changed from', lastUrl, 'to', currentUrl);
        lastUrl = currentUrl;

        // If we left a PR changes page, stop autoscroll
        if (!isGitHubPRChangesPage(currentUrl) && typeof (window as any).__ghAutoScrollStop === 'function') {
            console.log('[Auto-run] Left PR changes page, stopping autoscroll');
            (window as any).__ghAutoScrollStop();
        }

        // If we entered a PR changes page, maybe start autoscroll
        setTimeout(tryAutoRunAutoscroll, 500); // Wait for GitHub to render
    }
}).observe(document, {subtree: true, childList: true});
