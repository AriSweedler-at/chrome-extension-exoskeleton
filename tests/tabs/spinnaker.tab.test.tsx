import {describe, it, expect, beforeEach} from 'vitest';
import {TabRegistry} from '@library/popup-exo-tabs/tab-registry';

describe('Spinnaker Tab Registration', () => {
    beforeEach(async () => {
        await import('../../src/exo-tabs/spinnaker.tab');
    });

    it('registers spinnaker tab', () => {
        const tabs = TabRegistry.getVisibleTabs('https://spinnaker.k8s.shadowbox.cloud/#/search');
        expect(tabs.length).toBe(1);
        expect(tabs[0].id).toBe('spinnaker');
        expect(tabs[0].label).toBe('Spinnaker');
    });

    it('has priority 0 on Spinnaker search pages', () => {
        const tabs = TabRegistry.getVisibleTabs('https://spinnaker.k8s.shadowbox.cloud/#/search');
        expect(tabs[0].priority).toBe(0);
    });

    it('is not visible on non-Spinnaker pages', () => {
        const tabs = TabRegistry.getVisibleTabs('https://github.com/owner/repo');
        expect(tabs.length).toBe(0);
    });

    it('has enablementToggle enabled', () => {
        const tabs = TabRegistry.getVisibleTabs('https://spinnaker.k8s.shadowbox.cloud/#/search');
        expect(tabs[0].enablementToggle).toBe(true);
    });
});
