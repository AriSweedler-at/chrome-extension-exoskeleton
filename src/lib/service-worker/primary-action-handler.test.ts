import {describe, it, expect, vi, beforeEach} from 'vitest';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {PrimaryActionAction} from '@exo/lib/actions/primary-action.action';
import {initializePrimaryActionHandler} from '@exo/lib/service-worker/primary-action-handler';

vi.mock('@exo/exo-tabs', () => ({}));

describe('primary-action handler', () => {
    let handler: (payload: unknown, sender: chrome.runtime.MessageSender) => Promise<unknown>;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(PrimaryActionAction, 'handle').mockImplementation((h) => {
            handler = h as typeof handler;
        });
        initializePrimaryActionHandler();
    });

    it('dispatches to the sending tab with the payload URL', async () => {
        const dispatch = vi.spyOn(TabRegistry, 'dispatchPrimaryAction').mockResolvedValue();

        await handler({url: 'https://example.com/page'}, {
            tab: {id: 42},
        } as chrome.runtime.MessageSender);

        expect(dispatch).toHaveBeenCalledWith(42, 'https://example.com/page');
    });

    it('does nothing when the sender has no tab (e.g. another extension page)', async () => {
        const dispatch = vi.spyOn(TabRegistry, 'dispatchPrimaryAction').mockResolvedValue();

        await handler({url: 'https://example.com'}, {} as chrome.runtime.MessageSender);

        expect(dispatch).not.toHaveBeenCalled();
    });
});
