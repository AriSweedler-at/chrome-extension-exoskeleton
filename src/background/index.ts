import {Commands} from '@library/commands';
import {IncrementAction} from '../actions/increment.action';

// Handle split tab from keyboard or popup
async function handleOpenSplitTab() {
    // Feature detection - chrome.tabs.split API not yet available as of early 2026
    if (typeof chrome.tabs.split !== 'function') {
        // Use chrome.notifications API in service worker (document is not available)
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: 'Split Screen Not Available',
            message: 'Chrome split screen API not yet available for extensions',
        });
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
    } else if (command === 'toggle-github-autoscroll') {
        // Get active tab
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

        if (tab.id) {
            // Send toggle message to content script
            try {
                const response = await chrome.tabs.sendMessage(tab.id, {
                    type: 'GITHUB_AUTOSCROLL_TOGGLE',
                });
                console.log('GitHub autoscroll toggled via keyboard shortcut, active:', response.active);
            } catch (error) {
                console.error('Failed to toggle GitHub autoscroll:', error);
            }
        }
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'OPEN_SPLIT_TAB') {
        handleOpenSplitTab()
            .catch((error) => {
                console.error('Failed to open split tab:', error);
            });
        return true; // Indicates async response
    }
});

console.log('Chrome Extension Starter: Background service worker loaded');
