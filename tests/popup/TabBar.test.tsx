import {describe, it, expect, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {TabBar} from '../../src/popup/TabBar';
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
});
