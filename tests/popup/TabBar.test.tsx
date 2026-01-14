import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {TabBar} from '../../src/popup/TabBar';
import {Storage} from '../../src/library/storage';
import chrome from 'sinon-chrome';

describe('TabBar', () => {
    beforeEach(() => {
        chrome.reset();
        chrome.tabs.query.yields([
            {
                id: 123,
                url: 'http://example.com',
            },
        ]);
    });

    it('should render visible tabs', async () => {
        // This test will use the registered tabs
        await import('../../src/tabs/page-actions.tab');

        render(<TabBar />);

        // Wait for async query
        const element = await screen.findByText('Page Actions');

        expect(element).toBeTruthy();
    });

    it('should render tabs in priority order', async () => {
        await import('../../src/tabs/page-actions.tab');
        await import('../../src/tabs/so-sprint.tab');

        // Query with Airtable URL
        chrome.tabs.query.yields([
            {
                id: 123,
                url: 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6',
            },
        ]);

        render(<TabBar />);

        await screen.findByText('SO SPRINT');

        const buttons = screen.getAllByRole('button');
        expect(buttons[0].textContent).toContain('SO SPRINT'); // Priority 0
        expect(buttons[1].textContent).toContain('Page Actions'); // Priority 100
    });

    it('should call Storage.set when tab is clicked', async () => {
        await import('../../src/tabs/page-actions.tab');
        await import('../../src/tabs/so-sprint.tab');

        chrome.tabs.query.yields([
            {
                id: 123,
                url: 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6',
            },
        ]);

        // Mock Storage
        const storageSpy = vi.spyOn(Storage, 'set');

        render(<TabBar />);

        await screen.findByText('SO SPRINT');

        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[1]); // Click Page Actions tab

        await waitFor(() => {
            expect(storageSpy).toHaveBeenCalledWith('selectedTab:123', 'page-actions');
        });
    });

    it('should restore stored tab selection', async () => {
        await import('../../src/tabs/page-actions.tab');
        await import('../../src/tabs/so-sprint.tab');

        chrome.tabs.query.yields([
            {
                id: 123,
                url: 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6',
            },
        ]);

        // Mock Storage to return 'page-actions'
        vi.spyOn(Storage, 'get').mockResolvedValue('page-actions');

        render(<TabBar />);

        await waitFor(() => {
            const buttons = screen.getAllByRole('button');
            expect(buttons[1].className).toContain('active'); // Page Actions should be active
        });
    });

    it('should fall back to first visible tab when stored tab not found', async () => {
        await import('../../src/tabs/page-actions.tab');
        await import('../../src/tabs/so-sprint.tab');

        chrome.tabs.query.yields([
            {
                id: 123,
                url: 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6',
            },
        ]);

        // Mock Storage to return invalid tab ID
        vi.spyOn(Storage, 'get').mockResolvedValue('non-existent-tab');

        render(<TabBar />);

        await waitFor(() => {
            const buttons = screen.getAllByRole('button');
            expect(buttons[0].className).toContain('active'); // SO SPRINT (first) should be active
        });
    });
});
