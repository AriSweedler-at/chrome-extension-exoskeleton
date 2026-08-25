import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {Notifications} from '@exo/lib/toast-notification';
import {showToastPayload} from '@exo/lib/actions/show-toast.action';

describe('showToastPayload', () => {
    let container: HTMLElement;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Notifications as any).container = null;
        container = document.createElement('div');
        container.id = 'exo-notification-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Notifications as any).container = null;
        vi.clearAllTimers();
    });

    it('renders the message without detail', () => {
        showToastPayload({message: 'Copied!'});

        const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;
        expect(notification.textContent).toContain('Copied!');
    });

    it('renders the message headline alongside the detail block', async () => {
        showToastPayload({
            message: 'No primary action available',
            detail: 'Tried: OpenSearch, Spinnaker',
        });

        const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;
        await vi.waitFor(() => {
            expect(notification.textContent).toContain('No primary action available');
            expect(notification.textContent).toContain('Tried: OpenSearch, Spinnaker');
        });
        expect(notification.querySelector('pre')?.textContent).toBe('Tried: OpenSearch, Spinnaker');
    });
});
