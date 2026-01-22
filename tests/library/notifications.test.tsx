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

        it('should create container automatically if not present', () => {
            // Don't create a container - let Notifications create it
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (Notifications as any).container = null;

            // Remove the pre-created container
            const existingContainer = document.getElementById('notification-container');
            if (existingContainer) {
                existingContainer.remove();
            }

            Notifications.show('Test message');

            // Verify container was created
            const createdContainer = document.getElementById('notification-container');
            expect(createdContainer).toBeTruthy();
            expect(createdContainer?.children.length).toBe(1);

            // Clean up
            createdContainer?.remove();
        });

        it('should reuse cached container', () => {
            // First call - container is found in DOM
            Notifications.show('First message');

            // Verify container is now cached
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cachedContainer = (Notifications as any).container;
            expect(cachedContainer).toBe(container);

            // Second call - should use cached container
            Notifications.show('Second message');

            expect(container.children.length).toBe(2);
        });

        it('should handle notification removed before timeout', () => {
            vi.useFakeTimers();

            Notifications.show('Test message', 2000);

            const notification = container.querySelector('.chrome-ext-notification');
            expect(notification).toBeTruthy();

            // Manually remove notification before timeout
            notification?.remove();

            // Advance time - should not throw error
            expect(() => {
                vi.advanceTimersByTime(2000);
            }).not.toThrow();

            vi.useRealTimers();
        });
    });
});
