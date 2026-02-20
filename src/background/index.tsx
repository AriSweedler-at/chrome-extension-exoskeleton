import {ensureInjectContentScript, CONTENT_SCRIPT_PATH} from './content-script-injector';
import {initializeCommandHandlers} from './command-handlers';

/**
 * Background service worker entry point
 */

// Initialize command handlers
initializeCommandHandlers();

// Inject content script into existing tabs on extension install/update
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated:', details.reason);
    await ensureInjectContentScript(CONTENT_SCRIPT_PATH);
});

// Also inject when service worker starts (in case it was restarted)
ensureInjectContentScript(CONTENT_SCRIPT_PATH);

console.log('Chrome Extension Starter: Background service worker loaded');
