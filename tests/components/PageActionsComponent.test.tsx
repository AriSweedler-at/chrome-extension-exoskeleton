import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {PageActionsContent} from '../../src/components/PageActionsComponent';
import chrome from 'sinon-chrome';

describe('PageActionsComponent', () => {
    beforeEach(() => {
        chrome.reset();
        chrome.tabs.query.yields([{id: 123, url: 'http://example.com'}]);
        chrome.runtime.sendMessage.yields(undefined);
    });

    it('should render split tab button', async () => {
        render(<PageActionsContent />);

        const button = await screen.findByText('Open Split Tab');
        expect(button).toBeTruthy();
    });

    it('should send OPEN_SPLIT_TAB message when button clicked', async () => {
        const sendMessageSpy = vi.spyOn(chrome.runtime, 'sendMessage');

        render(<PageActionsContent />);

        const button = await screen.findByText('Open Split Tab');
        fireEvent.click(button);

        expect(sendMessageSpy).toHaveBeenCalledWith({
            type: 'OPEN_SPLIT_TAB',
        });
    });

    it('should show Ctrl+Shift+S in footer', async () => {
        render(<PageActionsContent />);

        const footer = await screen.findByText(/Ctrl\+Shift\+S/);
        expect(footer).toBeTruthy();
    });
});
