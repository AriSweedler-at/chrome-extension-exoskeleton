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
