import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {TabBar} from '../../src/popup/TabBar';
import {TabRegistry} from '../../src/library/tabs/tab-registry';
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

    it('should update active tab when clicked', async () => {
        await import('../../src/tabs/page-actions.tab');
        await import('../../src/tabs/so-sprint.tab');

        chrome.tabs.query.yields([
            {
                id: 123,
                url: 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6',
            },
        ]);

        // Mock Storage.get to resolve immediately (no stored selection)
        vi.spyOn(Storage, 'get').mockResolvedValue(null);

        render(<TabBar />);

        // Wait for both tabs to render and for SO SPRINT to be active
        await waitFor(() => {
            const buttons = screen.getAllByRole('button');
            expect(buttons[0].className).toContain('active');
        });

        const buttons = screen.getAllByRole('button');

        // SO SPRINT starts active (priority 0)
        expect(buttons[0].className).toContain('active');
        expect(buttons[1].className).toBe('');

        // Click Page Actions
        fireEvent.click(buttons[1]);

        await waitFor(() => {
            const newButtons = screen.getAllByRole('button');
            expect(newButtons[0].className).toBe('');
            expect(newButtons[1].className).toContain('active');
        });
    });

    it('should save tab selection to storage', async () => {
        await import('../../src/tabs/page-actions.tab');

        chrome.tabs.query.yields([
            {
                id: 456,
                url: 'http://example.com',
            },
        ]);

        const storageSpy = vi.spyOn(Storage, 'set');

        render(<TabBar />);

        await screen.findByText('Page Actions');

        // Initially should not have called set (just restored)
        expect(storageSpy).not.toHaveBeenCalled();

        const button = screen.getByRole('button', {name: 'Page Actions'});
        fireEvent.click(button);

        await waitFor(() => {
            expect(storageSpy).toHaveBeenCalledWith('selectedTab:456', 'page-actions');
        });
    });

    it('should restore stored selection on mount', async () => {
        await import('../../src/tabs/page-actions.tab');
        await import('../../src/tabs/so-sprint.tab');

        chrome.tabs.query.yields([
            {
                id: 789,
                url: 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6',
            },
        ]);

        // Mock storage to return page-actions (not the default first tab)
        vi.spyOn(Storage, 'get').mockResolvedValue('page-actions');

        render(<TabBar />);

        // Wait for async storage load
        await waitFor(() => {
            const buttons = screen.getAllByRole('button');
            // Page Actions should be active (even though SO SPRINT is priority 0)
            expect(buttons[1].className).toContain('active');
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

    it('renders TabEnablementSection for tabs with enablementToggle', async () => {
        TabRegistry.clearForTesting();

        const TestComponent = () => <div>Test Content</div>;

        TabRegistry.register({
            id: 'test-enablement',
            label: 'Test',
            component: TestComponent,
            getPriority: () => 0,
            enablementToggle: true,
        });

        vi.spyOn(Storage, 'get').mockResolvedValue(true);

        render(<TabBar />);

        await waitFor(() => {
            expect(screen.getByText('Test Content')).toBeInTheDocument();
        });

        expect(screen.getByText(/Enable on page load:/)).toBeInTheDocument();
    });

    it('does not render TabEnablementSection for tabs without enablementToggle', async () => {
        TabRegistry.clearForTesting();

        const TestComponent = () => <div>Test Content</div>;

        TabRegistry.register({
            id: 'test-no-enablement',
            label: 'Test',
            component: TestComponent,
            getPriority: () => 0,
        });

        vi.spyOn(Storage, 'get').mockResolvedValue(null);

        render(<TabBar />);

        await waitFor(() => {
            expect(screen.getByText('Test Content')).toBeInTheDocument();
        });

        expect(screen.queryByText(/Enable on page load:/)).not.toBeInTheDocument();
    });
});
