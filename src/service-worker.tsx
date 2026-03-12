import {
    ensureInjectContentScript,
    CONTENT_SCRIPT_PATH,
} from '@exo/lib/service-worker/content-script-injector';
import {initializeCommandHandlers} from '@exo/lib/service-worker/command-handlers';

/**
 * Background service worker entry point
 */

initializeCommandHandlers();

const CLOUDDEV_TERM_FONT = '"CaskaydiaMono Nerd Font", monospace';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== 'CLOUDDEV_TERM_SET_FONT') return false;

    // Resolve which tab to target: sender tab (content script) or active tab (popup)
    const getTabId = sender.tab?.id
        ? Promise.resolve(sender.tab.id)
        : chrome.tabs.query({active: true, currentWindow: true}).then(([t]) => t?.id);

    getTabId
        .then((tabId) => {
            if (!tabId) throw new Error('no tab');
            return chrome.scripting.executeScript({
                target: {tabId},
                world: 'MAIN',
                func: (fontFamily: string) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const term = (window as any).term;
                    if (!term?.options) return {applied: false, previous: '(no terminal found)'};
                    const previous = term.options.fontFamily || '(unset)';
                    term.options.fontFamily = fontFamily;
                    return {applied: true, previous};
                },
                args: [CLOUDDEV_TERM_FONT],
            });
        })
        .then(([result]) => sendResponse(result.result))
        .catch(() => sendResponse({applied: false, previous: '(script injection failed)'}));

    return true; // keep sendResponse channel open
});

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated:', details.reason);
    await ensureInjectContentScript(CONTENT_SCRIPT_PATH);
});

ensureInjectContentScript(CONTENT_SCRIPT_PATH);

console.log('Chrome Extension Starter: Background service worker loaded');
