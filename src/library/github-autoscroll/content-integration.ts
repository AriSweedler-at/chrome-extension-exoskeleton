import {initializeAutoScroll, isGitHubPRChangesPage} from '@exo/library/github-autoscroll';
import {Storage} from '@exo/library/storage';
import {Notifications} from '@exo/library/notifications';

/**
 * Try to auto-run autoscroll on GitHub PR changes pages
 */
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

/**
 * Setup SPA navigation listener for GitHub
 */
function setupSPANavigationListener() {
    let lastUrl = window.location.href;
    new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            console.log('[Auto-run] URL changed from', lastUrl, 'to', currentUrl);
            lastUrl = currentUrl;

            // If we left a PR changes page, stop autoscroll
            if (
                !isGitHubPRChangesPage(currentUrl) &&
                typeof (window as any).__ghAutoScrollStop === 'function'
            ) {
                console.log('[Auto-run] Left PR changes page, stopping autoscroll');
                (window as any).__ghAutoScrollStop();
            }

            // If we entered a PR changes page, maybe start autoscroll
            setTimeout(tryAutoRunAutoscroll, 500); // Wait for GitHub to render
        }
    }).observe(document, {subtree: true, childList: true});
}

/**
 * Initialize GitHub autoscroll message handlers
 */
function initializeMessageHandlers() {
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
                    Notifications.show({message: 'GitHub PR Autoscroll disabled', opacity: 0.5});
                    sendResponse({active: false});
                } else {
                    // Start autoscroll
                    const stopFn = initializeAutoScroll(true); // Enable debug mode
                    if (stopFn) {
                        (window as any).__ghAutoScrollStop = stopFn;
                        Notifications.show('GitHub PR Autoscroll enabled');
                        sendResponse({active: true});
                    } else {
                        Notifications.show(
                            "No files found. Make sure you're on a GitHub PR changes page.",
                        );
                        sendResponse({active: false});
                    }
                }
                return true;
            }

            return false;
        },
    );
}

/**
 * Initialize GitHub autoscroll integration
 */
export function initializeGitHubAutoscroll(): void {
    // Setup message handlers
    initializeMessageHandlers();

    // Setup SPA navigation listener
    setupSPANavigationListener();

    // Check on initial load
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
}
