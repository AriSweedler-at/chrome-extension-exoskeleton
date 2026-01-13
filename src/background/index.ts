import {Commands} from '@library/commands';
import {IncrementAction} from '../actions/increment.action';

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
    }
});

console.log('Chrome Extension Starter: Background service worker loaded');
