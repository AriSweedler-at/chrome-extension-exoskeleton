import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {RichLinkComponent} from '@exo/exo-tabs/richlink/RichLinkComponent';
import chrome from 'sinon-chrome';

const PAGE_URL = 'https://github.com/user/repo';

const FORMATS = [
    {label: 'Rich Link', text: 'My PR (#123)'},
    {label: 'Raw URL', text: PAGE_URL},
];

type ActionMessage = {type: string; payload: unknown};
type ActionResponse = {success: true; data: unknown} | {success: false; error: string};

function stubSendMessage(responses: Record<string, ActionResponse>) {
    chrome.tabs.sendMessage.callsFake(
        (_tabId: number, message: ActionMessage, callback: (response: ActionResponse) => void) => {
            callback(responses[message.type]);
        },
    );
}

describe('RichLinkComponent', () => {
    beforeEach(() => {
        chrome.reset();
        // CopyCounter uses chrome.storage.local
        chrome.storage.local.get.returns(Promise.resolve({}));
        chrome.storage.local.set.returns(Promise.resolve());
    });

    it('should render loading state initially', () => {
        chrome.tabs.query.resolves([{id: 1, url: PAGE_URL}]);
        stubSendMessage({GET_FORMATS: {success: true, data: FORMATS}});

        render(<RichLinkComponent />);

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render format buttons after loading', async () => {
        chrome.tabs.query.resolves([{id: 1, url: PAGE_URL}]);
        stubSendMessage({GET_FORMATS: {success: true, data: FORMATS}});

        render(<RichLinkComponent />);

        await waitFor(() => {
            expect(screen.getByText('Rich Link')).toBeInTheDocument();
        });
        expect(screen.getByText('My PR (#123)')).toBeInTheDocument();
        expect(screen.getByText('Raw URL')).toBeInTheDocument();
        expect(screen.getByText(/total copied: 0/i)).toBeInTheDocument();
    });

    it('should render an error for chrome:// pages', async () => {
        chrome.tabs.query.resolves([{id: 1, url: 'chrome://extensions'}]);

        render(<RichLinkComponent />);

        await waitFor(() => {
            expect(screen.getByText('Cannot copy links from chrome:// pages')).toBeInTheDocument();
        });
        expect(chrome.tabs.sendMessage.called).toBe(false);
    });

    it('should copy the clicked format and close the popup', async () => {
        chrome.tabs.query.resolves([{id: 1, url: PAGE_URL}]);
        stubSendMessage({
            GET_FORMATS: {success: true, data: FORMATS},
            COPY_RICH_LINK: {
                success: true,
                data: {success: true, formatIndex: 1, totalFormats: 2},
            },
        });
        const close = vi.spyOn(window, 'close').mockImplementation(() => {});

        render(<RichLinkComponent />);
        await waitFor(() => {
            expect(screen.getByText('Raw URL')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Raw URL'));

        await waitFor(() => {
            expect(close).toHaveBeenCalled();
        });
        expect(chrome.tabs.update.calledWith(1, {active: true})).toBe(true);
        const copyCall = chrome.tabs.sendMessage
            .getCalls()
            .find(
                (call: {args: [number, ActionMessage]}) => call.args[1].type === 'COPY_RICH_LINK',
            );
        expect(copyCall?.args[0]).toBe(1);
        expect(copyCall?.args[1].payload).toEqual({url: PAGE_URL, formatIndex: 1});
    });

    it('should render a copy error instead of closing when the copy fails', async () => {
        chrome.tabs.query.resolves([{id: 1, url: PAGE_URL}]);
        stubSendMessage({
            GET_FORMATS: {success: true, data: FORMATS},
            COPY_RICH_LINK: {success: false, error: 'Receiving end does not exist'},
        });
        const close = vi.spyOn(window, 'close').mockImplementation(() => {});

        render(<RichLinkComponent />);
        await waitFor(() => {
            expect(screen.getByText('Rich Link')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Rich Link'));

        await waitFor(() => {
            expect(
                screen.getByText('Failed to copy: Receiving end does not exist'),
            ).toBeInTheDocument();
        });
        expect(close).not.toHaveBeenCalled();
    });
});
