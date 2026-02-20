import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {Notifications} from '@exo/library/toast-notification';

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

            Notifications.show({message: 'Test message', duration: 2000});

            expect(container.children.length).toBe(1);

            // Advance past duration + fade animation (300ms)
            vi.advanceTimersByTime(2300);

            expect(container.children.length).toBe(0);

            vi.useRealTimers();
        });

        it('should use default duration if not specified', () => {
            vi.useFakeTimers();

            Notifications.show('Test message');

            expect(container.children.length).toBe(1);

            // Default duration is 5000ms; notification should still be present just before
            vi.advanceTimersByTime(4999);
            expect(container.children.length).toBe(1);

            // Advance past duration + fade animation (300ms)
            vi.advanceTimersByTime(301);
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

            Notifications.show({message: 'Test message', duration: 2000});

            const notification = container.querySelector('.chrome-ext-notification');
            expect(notification).toBeTruthy();

            // Manually remove notification before timeout
            notification?.remove();

            // Advance time - should not throw error
            expect(() => {
                vi.advanceTimersByTime(2300);
            }).not.toThrow();

            vi.useRealTimers();
        });

        it('should dismiss on click by default', () => {
            vi.useFakeTimers();

            Notifications.show({message: 'Click me', duration: 10000});
            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;
            expect(notification).toBeTruthy();

            notification.click();

            // Fade animation
            vi.advanceTimersByTime(300);
            expect(container.children.length).toBe(0);

            vi.useRealTimers();
        });

        it('should pause auto-dismiss on hover', () => {
            vi.useFakeTimers();

            Notifications.show({message: 'Hover me', duration: 1000});
            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;

            // Hover at 500ms (half the duration)
            vi.advanceTimersByTime(500);
            notification.dispatchEvent(new Event('mouseenter'));

            // Wait way past the original duration - should NOT be removed
            vi.advanceTimersByTime(2000);
            expect(container.children.length).toBe(1);

            // Unhover - timer resumes with remaining ~500ms
            notification.dispatchEvent(new Event('mouseleave'));
            vi.advanceTimersByTime(800); // 500 remaining + 300 animation
            expect(container.children.length).toBe(0);

            vi.useRealTimers();
        });

        it('should show close button and call onClick when provided', () => {
            const onClick = vi.fn();
            Notifications.show({message: 'Custom click', onClick});

            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;
            expect(notification.style.cursor).toBe('pointer');

            // Close button should exist
            const closeBtn = notification.querySelector('span');
            expect(closeBtn).toBeTruthy();
            expect(closeBtn?.textContent).toBe('\u00d7');

            // Clicking notification calls onClick
            notification.click();
            expect(onClick).toHaveBeenCalledWith(notification);
        });

        it('should dismiss via close button without triggering onClick', () => {
            vi.useFakeTimers();

            const onClick = vi.fn();
            Notifications.show({message: 'Close me', onClick, duration: 10000});

            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;
            const closeBtn = notification.querySelector('span') as HTMLElement;

            closeBtn.click();
            vi.advanceTimersByTime(300);

            expect(onClick).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);

            vi.useRealTimers();
        });
    });
});
