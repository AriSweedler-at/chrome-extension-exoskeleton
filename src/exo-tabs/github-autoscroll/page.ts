import {
    goToChangedFiles,
    goToConversation,
    initializeAutoScroll,
    isGitHubHost,
    isGitHubPRChangesPage,
    isGitHubPRPage,
} from '@exo/exo-tabs/github-autoscroll';
import {keybindings} from '@exo/lib/keybindings';
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
 * Register the PR tab-navigation keybindings on any GitHub PR page and remove
 * them when navigating to a non-PR GitHub page — we must not swallow those
 * keystrokes elsewhere on the site. Never calls keybindings.unlisten(): the
 * listener is a singleton shared by every page module, and an attached
 * listener with no matching bindings is harmless.
 */
function syncPRTabShortcuts() {
    if (isGitHubPRPage(window.location.href)) {
        keybindings.registerAll([
            {
                key: 'c',
                description: 'Go to Conversation tab',
                handler: goToConversation,
                context: 'GitHub PR',
            },
            {
                key: 'f',
                description: 'Go to Files changed tab',
                handler: goToChangedFiles,
                context: 'GitHub PR',
            },
        ]);
        keybindings.listen();
    } else {
        keybindings.unregister('c');
        keybindings.unregister('f');
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

            // Keep the PR tab-navigation shortcuts in sync with the new URL
            syncPRTabShortcuts();

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

    // The content script runs on <all_urls>; everything past message handling
    // is GitHub-only, so touch nothing (especially the shared keybinding
    // registry) on other sites.
    if (!isGitHubHost(window.location.href)) return;

    setupSPANavigationListener();

    // Register the PR tab-navigation shortcuts if we loaded onto a PR page
    syncPRTabShortcuts();

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
