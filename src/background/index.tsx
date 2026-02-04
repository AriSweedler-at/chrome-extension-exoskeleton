import {Commands} from '@library/commands';
import {CopyRichLinkAction} from '../actions/copy-rich-link.action';

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
        case 'toggle-github-autoscroll': await toggleGithubAutoscroll(); break;
        case 'copy-rich-link': await copyRichLink(); break;
        case 'copy-raw-url': await copyRawUrl(); break;
    }
});

console.log('Chrome Extension Starter: Background service worker loaded');
