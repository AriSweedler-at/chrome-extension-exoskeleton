import {describe, it, expect} from 'vitest';
import {TabRegistry} from '../../src/library/tabs/tab-registry';

// Import the tab to trigger registration
import '../../src/tabs/page-actions.tab';

describe('PageActions Tab', () => {
    it('should register with correct ID and label', () => {
        const tabs = TabRegistry.getVisibleTabs('http://example.com');
        const pageActionsTab = tabs.find((t) => t.id === 'page-actions');

        expect(pageActionsTab).toBeDefined();
        expect(pageActionsTab?.label).toBe('Page Actions');
    });

    it('should have priority 100 (default)', () => {
        const tabs = TabRegistry.getVisibleTabs('http://example.com');
        const pageActionsTab = tabs.find((t) => t.id === 'page-actions');

        expect(pageActionsTab?.priority).toBe(100);
    });

    it('should always be visible regardless of URL', () => {
        const urls = [
            'http://example.com',
            'https://google.com',
            'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6',
        ];

        urls.forEach((url) => {
            const tabs = TabRegistry.getVisibleTabs(url);
            const pageActionsTab = tabs.find((t) => t.id === 'page-actions');
            expect(pageActionsTab).toBeDefined();
        });
    });
});
