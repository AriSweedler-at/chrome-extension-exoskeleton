import {describe, it, expect, beforeEach, vi} from 'vitest';
import chrome from 'sinon-chrome';

describe('Split Tab Handler', () => {
    beforeEach(async () => {
        chrome.reset();
        chrome.tabs.query.resolves([{id: 123, url: 'http://example.com'}]);

        // Clear module cache to allow fresh imports
        vi.resetModules();
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

        // Mock chrome.runtime.getURL
        chrome.runtime.getURL.returns('chrome-extension://test/icons/icon48.png');

        // Mock chrome.notifications
        const notificationSpy = vi.fn();
        chrome.notifications = {
            create: notificationSpy,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        await import('../../src/background/index');

        const commandListener = chrome.commands.onCommand.addListener.getCall(0).args[0];
        await commandListener('open-split-tab');

        // Verify chrome.notifications.create was called
        expect(notificationSpy).toHaveBeenCalledWith({
            type: 'basic',
            iconUrl: 'chrome-extension://test/icons/icon48.png',
            title: 'Split Screen Not Available',
            message: 'Chrome split screen API not yet available for extensions',
        });
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
