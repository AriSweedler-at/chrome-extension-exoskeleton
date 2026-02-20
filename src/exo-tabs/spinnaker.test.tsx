import {describe, it, expect} from 'vitest';
import {TabRegistry} from '@exo/library/popup-exo-tabs/tab-registry';

// Import the tab - it will auto-register
import '@exo/exo-tabs/spinnaker.tab';

describe('Spinnaker Tab', () => {
    it('registers tab with correct id and label', () => {
        const tabs = TabRegistry.getVisibleTabs(
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/app/executions',
        );
        const spinnakerTab = tabs.find((t) => t.id === 'spinnaker');
        expect(spinnakerTab).toBeDefined();
        expect(spinnakerTab?.label).toBe('Spinnaker');
    });

    it('shows tab on Spinnaker pages', () => {
        const url =
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions';
        const tabs = TabRegistry.getVisibleTabs(url);
        const spinnakerTab = tabs.find((t) => t.id === 'spinnaker');
        expect(spinnakerTab).toBeDefined();
        expect(spinnakerTab?.priority).toBe(0);
    });

    it('shows tab on Spinnaker execution detail pages', () => {
        const url =
            'https://spinnaker.k8s.shadowbox.cloud/#/applications/hyperbase-deploy/executions/01HPN64GE091GK831P0XG2JQQT?stage=2&step=0&details=runJobConfig';
        const tabs = TabRegistry.getVisibleTabs(url);
        const spinnakerTab = tabs.find((t) => t.id === 'spinnaker');
        expect(spinnakerTab).toBeDefined();
        expect(spinnakerTab?.priority).toBe(0);
    });

    it('hides tab on non-Spinnaker pages', () => {
        const url = 'https://github.com/owner/repo';
        const tabs = TabRegistry.getVisibleTabs(url);
        const spinnakerTab = tabs.find((t) => t.id === 'spinnaker');
        expect(spinnakerTab).toBeUndefined();
    });

    it('hides tab on Google pages', () => {
        const url = 'https://www.google.com';
        const tabs = TabRegistry.getVisibleTabs(url);
        const spinnakerTab = tabs.find((t) => t.id === 'spinnaker');
        expect(spinnakerTab).toBeUndefined();
    });

    it('shows tab with priority 0 when URL contains spinnaker', () => {
        const url = 'https://my-spinnaker-instance.com/test';
        const tabs = TabRegistry.getVisibleTabs(url);
        const spinnakerTab = tabs.find((t) => t.id === 'spinnaker');
        expect(spinnakerTab).toBeDefined();
        expect(spinnakerTab?.priority).toBe(0);
    });

    it('is case-insensitive for spinnaker URL matching', () => {
        const url = 'https://my-SPINNAKER-instance.com/test';
        const tabs = TabRegistry.getVisibleTabs(url);
        const spinnakerTab = tabs.find((t) => t.id === 'spinnaker');
        expect(spinnakerTab).toBeDefined();
    });
});
