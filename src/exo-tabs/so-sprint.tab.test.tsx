import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {TabRegistry} from '@exo/library/popup-exo-tabs/tab-registry';

// Import the tab - it will auto-register
import './so-sprint.tab';

describe('SO SPRINT Tab', () => {
    const AIRTABLE_URL = 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6';
    const OTHER_URL = 'https://google.com';

    it('should register with correct ID and label', () => {
        const tabs = TabRegistry.getVisibleTabs(AIRTABLE_URL);
        const soSprintTab = tabs.find((t) => t.id === 'so-sprint');

        expect(soSprintTab).toBeDefined();
        expect(soSprintTab?.label).toBe('SO SPRINT');
    });

    it('should have priority 0 on Airtable URL', () => {
        const tabs = TabRegistry.getVisibleTabs(AIRTABLE_URL);
        const soSprintTab = tabs.find((t) => t.id === 'so-sprint');

        expect(soSprintTab?.priority).toBe(0);
    });

    it('should be hidden on other URLs', () => {
        const tabs = TabRegistry.getVisibleTabs(OTHER_URL);
        const soSprintTab = tabs.find((t) => t.id === 'so-sprint');

        expect(soSprintTab).toBeUndefined();
    });

    it('should render HELLO WORLD message', () => {
        const tabs = TabRegistry.getVisibleTabs(AIRTABLE_URL);
        const soSprintTab = tabs.find((t) => t.id === 'so-sprint');

        expect(soSprintTab).toBeDefined();

        const SoSprintComponent = soSprintTab!.component;
        render(<SoSprintComponent />);

        expect(screen.getByText(/HELLO, WORLD/)).toBeDefined();
        expect(screen.getByText(/SO SPRINT/)).toBeDefined();
    });
});
