import {describe, it, expect, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {RichLinkComponent} from '@exo/exo-tabs/richlink/RichLinkComponent';
import chrome from 'sinon-chrome';

describe('RichLinkComponent', () => {
    beforeEach(() => {
        chrome.reset();
        // CopyCounter uses chrome.storage.local
        chrome.storage.local.get.returns(Promise.resolve({}));
        chrome.storage.local.set.returns(Promise.resolve());
    });

    it('should render loading state initially', () => {
        render(<RichLinkComponent />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render formats after loading', async () => {
        chrome.tabs.query.yields([{url: 'https://github.com/user/repo'}]);

        render(<RichLinkComponent />);

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });
    });
});
