import {
    ensureInjectContentScript,
    CONTENT_SCRIPT_PATH,
} from '@exo/lib/service-worker/content-script-injector';
import {initializePrimaryActionHandler} from '@exo/lib/service-worker/primary-action-handler';

/**
 * Background service worker entry point
 */

initializePrimaryActionHandler();

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated:', details.reason);
    // The copy-counter feature was removed 2026-08 — purge its orphaned entry.
    void chrome.storage.local.remove('richlink-copy-count');
    await ensureInjectContentScript(CONTENT_SCRIPT_PATH);
});

ensureInjectContentScript(CONTENT_SCRIPT_PATH);

console.log('Chrome Extension Starter: Background service worker loaded');
