import {
    ensureInjectContentScript,
    CONTENT_SCRIPT_PATH,
} from '@exo/lib/service-worker/content-script-injector';
import {initializeCommandHandlers} from '@exo/lib/service-worker/command-handlers';

/**
 * Background service worker entry point
 */

initializeCommandHandlers();

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated:', details.reason);
    await ensureInjectContentScript(CONTENT_SCRIPT_PATH);
});

ensureInjectContentScript(CONTENT_SCRIPT_PATH);

console.log('Chrome Extension Starter: Background service worker loaded');
