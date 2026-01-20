import React from 'react';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {GitHubAutoscrollContent} from '../../src/components/GitHubAutoscrollComponent';

describe('GitHubAutoscrollContent', () => {
    beforeEach(() => {
        vi.stubGlobal('chrome', {
            tabs: {
                query: vi.fn(),
                sendMessage: vi.fn(),
            },
            runtime: {
                sendMessage: vi.fn(),
            },
        });
    });

    it('renders status and toggle button', async () => {
        (chrome.tabs.query as typeof chrome.tabs.query).mockImplementation((_, callback) => {
            callback([{id: 123}]);
        });
        (chrome.tabs.sendMessage as typeof chrome.tabs.sendMessage).mockResolvedValue({active: false});

        render(<GitHubAutoscrollContent />);

        await waitFor(() => {
            expect(screen.getByText(/Inactive/)).toBeInTheDocument();
        });
        expect(screen.getByText('Enable')).toBeInTheDocument();
    });

    it('shows active status when autoscroll is running', async () => {
        (chrome.tabs.query as typeof chrome.tabs.query).mockImplementation((_, callback) => {
            callback([{id: 123}]);
        });
        (chrome.tabs.sendMessage as typeof chrome.tabs.sendMessage).mockResolvedValue({active: true});

        render(<GitHubAutoscrollContent />);

        await waitFor(() => {
            expect(screen.getByText(/Active/)).toBeInTheDocument();
        });
        expect(screen.getByText('Disable')).toBeInTheDocument();
    });

    it('toggles autoscroll when button clicked', async () => {
        const user = userEvent.setup();
        (chrome.tabs.query as typeof chrome.tabs.query).mockImplementation((_, callback) => {
            callback([{id: 123}]);
        });
        (chrome.tabs.sendMessage as typeof chrome.tabs.sendMessage)
            .mockResolvedValueOnce({active: false})
            .mockResolvedValueOnce({active: true});

        render(<GitHubAutoscrollContent />);

        await waitFor(() => {
            expect(screen.getByText('Enable')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Enable'));

        await waitFor(() => {
            expect(screen.getByText('Disable')).toBeInTheDocument();
        });
    });
});
