import {describe, it, expect, vi, beforeEach, type Mock} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';

// Import the tab - it will auto-register
import '@exo/exo-tabs/clouddev-term/tab';

const TERM_URL = 'https://ari-sweedler-devenv-term.clouddev.hyperbasedev.com/';
const OTHER_TERM_URL = 'https://some-other-devenv-term.clouddev.hyperbasedev.com/';
const NON_TERM_URL = 'https://github.com/owner/repo';
const SIMILAR_BUT_NOT_URL = 'https://not-term.clouddev.hyperbasedev.com.evil.com/';

describe('Clouddev Terminal Tab', () => {
    it('registers with correct id and label', () => {
        const tabs = TabRegistry.getVisibleTabs(TERM_URL);
        const tab = tabs.find((t) => t.id === 'clouddev-term');
        expect(tab).toBeDefined();
        expect(tab?.label).toBe('Terminal');
    });

    it('has priority 0 on clouddev term pages', () => {
        const tabs = TabRegistry.getVisibleTabs(TERM_URL);
        const tab = tabs.find((t) => t.id === 'clouddev-term');
        expect(tab?.priority).toBe(0);
    });

    it('matches other devenv term subdomains', () => {
        const tabs = TabRegistry.getVisibleTabs(OTHER_TERM_URL);
        const tab = tabs.find((t) => t.id === 'clouddev-term');
        expect(tab).toBeDefined();
        expect(tab?.priority).toBe(0);
    });

    it('is hidden on non-term pages', () => {
        const tabs = TabRegistry.getVisibleTabs(NON_TERM_URL);
        const tab = tabs.find((t) => t.id === 'clouddev-term');
        expect(tab).toBeUndefined();
    });

    it('does not match lookalike domains', () => {
        const tabs = TabRegistry.getVisibleTabs(SIMILAR_BUT_NOT_URL);
        const tab = tabs.find((t) => t.id === 'clouddev-term');
        expect(tab).toBeUndefined();
    });

    it('renders a set-font button', () => {
        const tabs = TabRegistry.getVisibleTabs(TERM_URL);
        const tab = tabs.find((t) => t.id === 'clouddev-term')!;
        const Component = tab.component;
        render(<Component />);
        expect(screen.getByText('Set CaskaydiaMono Nerd Font')).toBeDefined();
    });
});

describe('ClouddevTermComponent interactions', () => {
    beforeEach(() => {
        vi.stubGlobal('chrome', {
            runtime: {
                sendMessage: vi.fn(),
            },
        });
    });

    it('shows status after clicking button on success', async () => {
        (chrome.runtime.sendMessage as Mock).mockResolvedValueOnce({
            applied: true,
            previous: 'courier-new',
        });

        const tabs = TabRegistry.getVisibleTabs(TERM_URL);
        const tab = tabs.find((t) => t.id === 'clouddev-term')!;
        const Component = tab.component;
        render(<Component />);

        fireEvent.click(screen.getByText('Set CaskaydiaMono Nerd Font'));

        await waitFor(() => {
            expect(screen.getByText('Font set (was: courier-new)')).toBeDefined();
        });
    });

    it('shows error status on failure', async () => {
        (chrome.runtime.sendMessage as Mock).mockResolvedValueOnce({
            applied: false,
            previous: '(no terminal found)',
        });

        const tabs = TabRegistry.getVisibleTabs(TERM_URL);
        const tab = tabs.find((t) => t.id === 'clouddev-term')!;
        const Component = tab.component;
        render(<Component />);

        fireEvent.click(screen.getByText('Set CaskaydiaMono Nerd Font'));

        await waitFor(() => {
            expect(screen.getByText('(no terminal found)')).toBeDefined();
        });
    });

    it('shows fallback message when sendMessage throws', async () => {
        (chrome.runtime.sendMessage as Mock).mockRejectedValueOnce(new Error('disconnected'));

        const tabs = TabRegistry.getVisibleTabs(TERM_URL);
        const tab = tabs.find((t) => t.id === 'clouddev-term')!;
        const Component = tab.component;
        render(<Component />);

        fireEvent.click(screen.getByText('Set CaskaydiaMono Nerd Font'));

        await waitFor(() => {
            expect(screen.getByText(/Failed/)).toBeDefined();
        });
    });
});
