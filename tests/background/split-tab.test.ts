import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import chrome from 'sinon-chrome';

describe('Split Tab Handler', () => {
    let container: HTMLElement;

    beforeEach(async () => {
        chrome.reset();
        chrome.tabs.query.resolves([{id: 123, url: 'http://example.com'}]);

        // Create a container for notifications
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);

        // Clear module cache to allow fresh imports
        vi.resetModules();
    });

    afterEach(() => {
        // Clean up
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    it('should call chrome.tabs.split when feature is available', async () => {
        // Mock split API as available
        chrome.tabs.split = vi.fn().mockResolvedValue(undefined);

        // Import to trigger handler registration
        await import('../../src/background/index');

        // Get the command listener
        const commandListener = chrome.commands.onCommand.addListener.getCall(0).args[0];

        // Trigger command
        await commandListener('open-split-tab');

        // Verify split was called
        expect(chrome.tabs.split).toHaveBeenCalledWith({
            tabId: 123,
            newTabUrl: 'about:blank',
        });
    });

    it('should show notification when split API not available', async () => {
        // Mock split API as unavailable
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (chrome.tabs as any).split;

        await import('../../src/background/index');

        const commandListener = chrome.commands.onCommand.addListener.getCall(0).args[0];
        await commandListener('open-split-tab');

        // Verify notification was shown
        const notification = container.querySelector('.chrome-ext-notification');
        expect(notification).toBeTruthy();
        expect(notification?.textContent).toContain('Split screen not enabled');
        expect(chrome.tabs.split).toBeUndefined();
    });

    it('should handle message from popup', async () => {
        chrome.tabs.split = vi.fn().mockResolvedValue(undefined);

        await import('../../src/background/index');

        const messageListener = chrome.runtime.onMessage.addListener.getCall(0).args[0];
        await messageListener({type: 'OPEN_SPLIT_TAB'});

        expect(chrome.tabs.split).toHaveBeenCalledWith({
            tabId: 123,
            newTabUrl: 'about:blank',
        });
    });
});
