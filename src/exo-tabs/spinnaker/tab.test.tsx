import {describe, it, expect} from 'vitest';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';

// Import the tab - it will auto-register
import '@exo/exo-tabs/spinnaker/tab';

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

    it('shows tab on alpha-shadowbox Spinnaker', () => {
        const url = 'https://spinnaker.k8s.alpha-shadowbox.cloud/#/applications/app/executions';
        const tabs = TabRegistry.getVisibleTabs(url);
        const spinnakerTab = tabs.find((t) => t.id === 'spinnaker');
        expect(spinnakerTab).toBeDefined();
        expect(spinnakerTab?.priority).toBe(0);
    });

    it('does not match URLs that merely contain "spinnaker" as substring', () => {
        const url = 'https://docs.google.com/document/d/spinnaker-notes';
        const tabs = TabRegistry.getVisibleTabs(url);
        const spinnakerTab = tabs.find((t) => t.id === 'spinnaker');
        expect(spinnakerTab).toBeUndefined();
    });
});
