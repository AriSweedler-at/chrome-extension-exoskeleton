import {describe, it, expect, beforeEach, vi} from 'vitest';
import {initializeCommandHandlers} from '@exo/lib/service-worker/command-handlers';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {CopyRichLinkAction} from '@exo/exo-tabs/richlink/action';
import chrome from 'sinon-chrome';

type CommandListener = (command: string) => Promise<void>;

function registerAndGetListener(): CommandListener {
    initializeCommandHandlers();
    return chrome.commands.onCommand.addListener.getCall(0).args[0];
}

describe('initializeCommandHandlers', () => {
    beforeEach(() => {
        chrome.reset();
    });

    it('should dispatch copy-rich-link to the active tab', async () => {
        const sendToTab = vi
            .spyOn(CopyRichLinkAction, 'sendToTab')
            .mockResolvedValue(undefined as never);
        chrome.tabs.query.resolves([{id: 7, url: 'https://example.com/'}]);

        await registerAndGetListener()('copy-rich-link');

        expect(sendToTab).toHaveBeenCalledWith(7, {url: 'https://example.com/'});
    });

    it('should dispatch primary-action to the tab registry', async () => {
        const dispatch = vi
            .spyOn(TabRegistry, 'dispatchPrimaryAction')
            .mockResolvedValue(undefined);
        chrome.tabs.query.resolves([{id: 9, url: 'https://example.com/page'}]);

        await registerAndGetListener()('primary-action');

        expect(dispatch).toHaveBeenCalledWith(9, 'https://example.com/page');
    });

    it('should resolve without throwing when the query returns no tab', async () => {
        const sendToTab = vi
            .spyOn(CopyRichLinkAction, 'sendToTab')
            .mockResolvedValue(undefined as never);
        const dispatch = vi
            .spyOn(TabRegistry, 'dispatchPrimaryAction')
            .mockResolvedValue(undefined);
        chrome.tabs.query.resolves([]);

        const listener = registerAndGetListener();
        await expect(listener('copy-rich-link')).resolves.toBeUndefined();
        await expect(listener('primary-action')).resolves.toBeUndefined();

        expect(sendToTab).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('should do nothing when the tab has no url', async () => {
        const sendToTab = vi
            .spyOn(CopyRichLinkAction, 'sendToTab')
            .mockResolvedValue(undefined as never);
        chrome.tabs.query.resolves([{id: 7}]);

        await registerAndGetListener()('copy-rich-link');

        expect(sendToTab).not.toHaveBeenCalled();
    });

    it('should ignore unknown commands', async () => {
        await registerAndGetListener()('unknown-command');

        expect(chrome.tabs.query.called).toBe(false);
    });

    it('should catch copy-rich-link failures instead of rejecting', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(CopyRichLinkAction, 'sendToTab').mockRejectedValue(
            new Error('Could not establish connection. Receiving end does not exist.'),
        );
        chrome.tabs.query.resolves([{id: 7, url: 'https://example.com/'}]);

        await expect(registerAndGetListener()('copy-rich-link')).resolves.toBeUndefined();

        expect(consoleError).toHaveBeenCalled();
    });

    it('should catch primary-action failures instead of rejecting', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(TabRegistry, 'dispatchPrimaryAction').mockRejectedValue(new Error('boom'));
        chrome.tabs.query.resolves([{id: 7, url: 'https://example.com/'}]);

        await expect(registerAndGetListener()('primary-action')).resolves.toBeUndefined();

        expect(consoleError).toHaveBeenCalled();
    });
});
