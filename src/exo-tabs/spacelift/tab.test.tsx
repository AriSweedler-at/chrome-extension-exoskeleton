import {describe, it, expect} from 'vitest';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';

import '@exo/exo-tabs/spacelift/tab';

describe('Spacelift Tab', () => {
    it('registers with correct id and label', () => {
        const tabs = TabRegistry.getVisibleTabs(
            'https://spacelift.shadowbox.cloud/stack/foo-staging',
        );
        const tab = tabs.find((t) => t.id === 'spacelift');
        expect(tab).toBeDefined();
        expect(tab?.label).toBe('Spacelift');
    });

    it('is visible on stack pages', () => {
        const tabs = TabRegistry.getVisibleTabs(
            'https://spacelift.shadowbox.cloud/stack/sendsafely-production',
        );
        expect(tabs.find((t) => t.id === 'spacelift')).toBeDefined();
    });

    it('is hidden on non-stack pages', () => {
        const tabs = TabRegistry.getVisibleTabs('https://spacelift.shadowbox.cloud/runs');
        expect(tabs.find((t) => t.id === 'spacelift')).toBeUndefined();
    });

    it('is hidden on non-Spacelift pages', () => {
        const tabs = TabRegistry.getVisibleTabs('https://github.com/owner/repo');
        expect(tabs.find((t) => t.id === 'spacelift')).toBeUndefined();
    });
});
