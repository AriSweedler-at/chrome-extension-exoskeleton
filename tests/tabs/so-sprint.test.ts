import {describe, it, expect, beforeEach} from 'vitest';
import React from 'react';
import {TabRegistry} from '../../src/library/tabs/tab-registry';
import {Component} from '../../src/library/components/base-component';

// Define the SO SPRINT component locally for testing
class SoSprintComponent extends Component {
    render() {
        return React.createElement('div', null, 'HELLO, WORLD - you are in SO SPRINT');
    }
}

describe('SO SPRINT Tab', () => {
    const AIRTABLE_URL = 'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6';
    const OTHER_URL = 'https://google.com';

    beforeEach(() => {
        TabRegistry.clearForTesting();
        // Re-register the tab for each test
        TabRegistry.register({
            id: 'so-sprint',
            label: 'SO SPRINT',
            component: SoSprintComponent,
            getPriority: (url: string) => {
                if (url === AIRTABLE_URL) {
                    return 0;
                }
                return Number.MAX_SAFE_INTEGER;
            },
        });
    });

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

        const result = Component.renderInstance(soSprintTab!.component);

        expect(result.props.children).toContain('HELLO, WORLD');
        expect(result.props.children).toContain('SO SPRINT');
    });
});
