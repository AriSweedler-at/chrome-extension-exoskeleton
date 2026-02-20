import {describe, it, expect, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {RichLinkComponent} from '@library/richlink/RichLinkComponent';

describe('RichLinkComponent', () => {
    it('should render loading state initially', () => {
        render(<RichLinkComponent />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render formats after loading', async () => {
        // Mock chrome.tabs.query
        vi.stubGlobal('chrome', {
            tabs: {
                query: vi.fn().mockResolvedValue([{url: 'https://github.com/user/repo'}]),
            },
        });

        render(<RichLinkComponent />);

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });
    });
});
