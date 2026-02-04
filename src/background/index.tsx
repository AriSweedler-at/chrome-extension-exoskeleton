import {Commands} from '@library/commands';
import {IncrementAction} from '../actions/increment.action';
import {CopyRichLinkAction} from '../actions/copy-rich-link.action';

async function incrementCounter() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    if (tab.id) {
        try {
            await IncrementAction.sendToTab(tab.id, {amount: 1});
            console.log('Counter incremented via keyboard shortcut');
        } catch (error) {
            console.error('Failed to increment counter:', error);
        }
    }
}

async function openSplitTab() {
    // Feature detection - chrome.tabs.split API not yet available as of early 2026
    if (typeof chrome.tabs.split !== 'function') {
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

async function toggleGithubAutoscroll() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    if (tab.id) {
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

async function copyRichLink() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    if (tab.id && tab.url) {
        try {
            await CopyRichLinkAction.sendToTab(tab.id, {url: tab.url});
            console.log('Rich link copied via keyboard shortcut');
        } catch (error) {
            console.error('Failed to copy rich link:', error);
        }
    }
}

async function copyRawUrl() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    if (tab.id && tab.url) {
        try {
            await CopyRichLinkAction.sendToTab(tab.id, {url: tab.url, formatLabel: 'Raw URL'});
            console.log('Raw URL copied via keyboard shortcut');
        } catch (error) {
            console.error('Failed to copy raw URL:', error);
        }
    }
}

// Listen for keyboard commands
Commands.onCommand(async (command) => {
    console.log('Command received:', command);

    switch (command) {
        case 'increment-counter': await incrementCounter(); break;
        case 'open-split-tab': await openSplitTab(); break;
        case 'toggle-github-autoscroll': await toggleGithubAutoscroll(); break;
        case 'copy-rich-link': await copyRichLink(); break;
        case 'copy-raw-url': await copyRawUrl(); break;
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'OPEN_SPLIT_TAB') {
        openSplitTab()
            .catch((error) => {
                console.error('Failed to open split tab:', error);
            });
        return true; // Indicates async response
    }
});

console.log('Chrome Extension Starter: Background service worker loaded');
