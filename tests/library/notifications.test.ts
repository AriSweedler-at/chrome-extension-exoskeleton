import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {Notifications} from '../../src/library/notifications';

describe('Notifications', () => {
    let container: HTMLElement;

    beforeEach(() => {
        // Reset Notifications container
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Notifications as any).container = null;

        // Create a container for notifications
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        // Clean up
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Notifications as any).container = null;
        vi.clearAllTimers();
    });

    describe('show', () => {
        it('should create a notification element', () => {
            Notifications.show('Test message');

            const notification = container.querySelector('.chrome-ext-notification');
            expect(notification).toBeTruthy();
            expect(notification?.textContent).toBe('Test message');
        });

        it('should auto-remove notification after duration', () => {
            vi.useFakeTimers();

            Notifications.show('Test message', 2000);

            expect(container.children.length).toBe(1);

            vi.advanceTimersByTime(2000);

            expect(container.children.length).toBe(0);

            vi.useRealTimers();
        });

        it('should use default duration if not specified', () => {
            vi.useFakeTimers();

            Notifications.show('Test message');

            expect(container.children.length).toBe(1);

            vi.advanceTimersByTime(2999);
            expect(container.children.length).toBe(1);

            vi.advanceTimersByTime(1);
            expect(container.children.length).toBe(0);

            vi.useRealTimers();
        });
    });
});
