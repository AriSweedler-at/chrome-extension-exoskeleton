import React from 'react';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {GitHubAutoscrollContent} from '@exo/lib/github-autoscroll/GitHubAutoscrollComponent';

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
            storage: {
                local: {
                    get: vi.fn((_key, callback) => {
                        // Default: return undefined (which means "use default value")
                        callback({});
                    }),
                    set: vi.fn((_, callback) => {
                        if (callback) callback();
                    }),
                },
            },
        });
    });

    it('renders status and toggle button', async () => {
        (chrome.tabs.query as typeof chrome.tabs.query).mockImplementation((_, callback) => {
            callback([{id: 123}]);
        });
        (chrome.tabs.sendMessage as typeof chrome.tabs.sendMessage).mockResolvedValue({
            active: false,
        });

        render(<GitHubAutoscrollContent />);

        await waitFor(() => {
            expect(screen.getByText(/Inactive/)).toBeInTheDocument();
        });
    });

    it('shows active status when autoscroll is running', async () => {
        (chrome.tabs.query as typeof chrome.tabs.query).mockImplementation((_, callback) => {
            callback([{id: 123}]);
        });
        (chrome.tabs.sendMessage as typeof chrome.tabs.sendMessage).mockResolvedValue({
            active: true,
        });

        render(<GitHubAutoscrollContent />);

        await waitFor(() => {
            expect(screen.getByText(/✓ Active/)).toBeInTheDocument();
        });
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
            expect(screen.getByText(/○ Inactive/)).toBeInTheDocument();
        });

        await user.click(screen.getByText(/○ Inactive/));

        await waitFor(() => {
            expect(screen.getByText(/✓ Active/)).toBeInTheDocument();
        });
    });

    it('handles empty tabs array gracefully', async () => {
        (chrome.tabs.query as typeof chrome.tabs.query).mockImplementation((_, callback) => {
            callback([]);
        });

        render(<GitHubAutoscrollContent />);

        await waitFor(() => {
            expect(screen.getByText(/○ Inactive/)).toBeInTheDocument();
        });
    });

    it('handles tab without ID', async () => {
        (chrome.tabs.query as typeof chrome.tabs.query).mockImplementation((_, callback) => {
            callback([{} as chrome.tabs.Tab]);
        });

        render(<GitHubAutoscrollContent />);

        await waitFor(() => {
            expect(screen.getByText(/○ Inactive/)).toBeInTheDocument();
        });
    });

    it('shows error message when toggle fails', async () => {
        const user = userEvent.setup();
        (chrome.tabs.query as typeof chrome.tabs.query).mockImplementation((_, callback) => {
            callback([{id: 123}]);
        });
        (chrome.tabs.sendMessage as typeof chrome.tabs.sendMessage)
            .mockResolvedValueOnce({active: false})
            .mockRejectedValueOnce(new Error('Connection error'));

        render(<GitHubAutoscrollContent />);

        await waitFor(() => {
            expect(screen.getByText(/○ Inactive/)).toBeInTheDocument();
        });

        await user.click(screen.getByText(/○ Inactive/));

        await waitFor(() => {
            expect(screen.getByTestId('error-message')).toBeInTheDocument();
        });
        expect(
            screen.getByText('Failed to toggle autoscroll. Please try again.'),
        ).toBeInTheDocument();
    });
});
