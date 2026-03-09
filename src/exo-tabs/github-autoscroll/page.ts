import {initializeAutoScroll, isGitHubPRChangesPage} from '@exo/exo-tabs/github-autoscroll';
import {Storage} from '@exo/lib/storage';
import {Notifications} from '@exo/lib/toast-notification';

declare global {
    interface Window {
        __ghAutoScrollStop?: (() => void) | undefined;
    }
}

/**
 * Try to auto-run autoscroll on GitHub PR changes pages
 */
async function tryAutoRunAutoscroll() {
    if (!isGitHubPRChangesPage(window.location.href)) return;

    // Prevent race condition if already running
    if (typeof window.__ghAutoScrollStop === 'function') return;

    const exorun = await Storage.get<boolean>('exorun-github-autoscroll');
    const shouldAutoRun = exorun === undefined ? true : exorun;

    if (shouldAutoRun) {
        const stopFn = initializeAutoScroll();
        if (stopFn) {
            window.__ghAutoScrollStop = stopFn;
            Notifications.show({message: 'GitHub PR Autoscroll enabled'});
        }
    }
}

/**
 * Setup SPA navigation listener for GitHub
 */
function setupSPANavigationListener() {
    let lastUrl = window.location.href;
    new MutationObserver(() => {
        // Guard against teardown (MutationObserver can fire after environment cleanup)
        if (typeof window === 'undefined') return;

        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;

            // If we left a PR changes page, stop autoscroll
            if (
                !isGitHubPRChangesPage(currentUrl) &&
                typeof window.__ghAutoScrollStop === 'function'
            ) {
                window.__ghAutoScrollStop();
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
            sendResponse: (response: {active: boolean}) => void,
        ) => {
            if (message.type === 'GITHUB_AUTOSCROLL_GET_STATUS') {
                const active = typeof window.__ghAutoScrollStop === 'function';
                sendResponse({active});
                return true;
            }

            if (message.type === 'GITHUB_AUTOSCROLL_TOGGLE') {
                if (typeof window.__ghAutoScrollStop === 'function') {
                    // Stop autoscroll
                    window.__ghAutoScrollStop();
                    Notifications.show({message: 'GitHub PR Autoscroll disabled', opacity: 0.5});
                    sendResponse({active: false});
                } else {
                    // Start autoscroll
                    const stopFn = initializeAutoScroll();
                    if (stopFn) {
                        window.__ghAutoScrollStop = stopFn;
                        Notifications.show({message: 'GitHub PR Autoscroll enabled'});
                        sendResponse({active: true});
                    } else {
                        Notifications.show({
                            message:
                                "No files found. Make sure you're on a GitHub PR changes page.",
                        });
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
 * Initialize GitHub autoscroll (runs at module level)
 */
function initialize(): void {
    initializeMessageHandlers();
    setupSPANavigationListener();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(tryAutoRunAutoscroll, 500); // Wait for GitHub to render
        });
    } else {
        setTimeout(tryAutoRunAutoscroll, 500); // Wait for GitHub to render
    }
}

// Self-register: importing this module initializes GitHub autoscroll
initialize();
