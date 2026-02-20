import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {Notifications} from '@exo/lib/toast-notification';

/** Simulate the CSS animation completing on a notification's timer bar. */
function finishTimerBar(notification: HTMLElement): void {
    const timerBar = notification.querySelector('.exo-toast-timer-bar') as HTMLElement;
    timerBar.dispatchEvent(new Event('animationend'));
}

describe('Notifications', () => {
    let container: HTMLElement;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Notifications as any).container = null;
        container = document.createElement('div');
        container.id = 'notification-container';
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

    describe('show', () => {
        it('should create a notification element', () => {
            Notifications.show('Test message');

            const notification = container.querySelector('.chrome-ext-notification');
            expect(notification).toBeTruthy();
            expect(notification?.textContent).toBe('Test message');
        });

        it('should set timer bar animation with specified duration', () => {
            Notifications.show({message: 'Test', duration: 2000});
            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;
            const timerBar = notification.querySelector('.exo-toast-timer-bar') as HTMLElement;

            expect(timerBar.style.animation).toContain('exo-toast-timer');
            expect(timerBar.style.animation).toContain('2000ms');
        });

        it('should use default duration for timer bar animation', () => {
            Notifications.show('Test');
            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;
            const timerBar = notification.querySelector('.exo-toast-timer-bar') as HTMLElement;

            expect(timerBar.style.animation).toContain('5000ms');
        });

        it('should dismiss when timer bar animation ends', () => {
            vi.useFakeTimers();

            Notifications.show({message: 'Test', duration: 2000});
            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;

            finishTimerBar(notification);

            // Fade animation (300ms)
            vi.advanceTimersByTime(300);
            expect(notification.parentNode).toBeFalsy();

            vi.useRealTimers();
        });

        it('should create container automatically if not present', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (Notifications as any).container = null;
            const existingContainer = document.getElementById('notification-container');
            if (existingContainer) existingContainer.remove();

            Notifications.show('Test message');

            const createdContainer = document.getElementById('notification-container');
            expect(createdContainer).toBeTruthy();
            expect(createdContainer?.children.length).toBe(1);

            createdContainer?.remove();
        });

        it('should reuse cached container', () => {
            Notifications.show('First message');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((Notifications as any).container).toBe(container);

            Notifications.show('Second message');
            expect(container.children.length).toBe(2);
        });

        it('should handle notification removed before animation ends', () => {
            Notifications.show({message: 'Test', duration: 2000});
            const notification = container.querySelector('.chrome-ext-notification');
            notification?.remove();

            // Should not throw
            expect(() => {
                // Animation would never fire since element is removed, but just in case
            }).not.toThrow();
        });

        it('should dismiss on click by default', () => {
            vi.useFakeTimers();

            Notifications.show({message: 'Click me', duration: 10000});
            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;

            notification.click();

            vi.advanceTimersByTime(300);
            expect(container.querySelector('.chrome-ext-notification')).toBeFalsy();

            vi.useRealTimers();
        });

        it('should pause auto-dismiss on hover and resume on leave', () => {
            vi.useFakeTimers();

            Notifications.show({message: 'Hover me', duration: 1000});
            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;
            const timerBar = notification.querySelector('.exo-toast-timer-bar') as HTMLElement;

            // Hover pauses animation
            notification.dispatchEvent(new Event('mouseenter'));
            expect(timerBar.style.animationPlayState).toBe('paused');

            // Unhover resumes animation from where it was
            notification.dispatchEvent(new Event('mouseleave'));
            expect(timerBar.style.animationPlayState).toBe('running');

            // Animation ends after resume
            finishTimerBar(notification);
            vi.advanceTimersByTime(300);
            expect(notification.parentNode).toBeFalsy();

            vi.useRealTimers();
        });

        it('should show close button and call onClick when provided', () => {
            const onClick = vi.fn();
            Notifications.show({message: 'Custom click', onClick});

            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;
            expect(notification.style.cursor).toBe('pointer');

            const closeBtn = notification.querySelector('span');
            expect(closeBtn).toBeTruthy();
            expect(closeBtn?.textContent).toBe('\u23F8\uFE0E');

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
            expect(container.querySelector('.chrome-ext-notification')).toBeFalsy();

            vi.useRealTimers();
        });
    });

    describe('hover pinning', () => {
        it('should insert spacer and pin notification on hover', () => {
            Notifications.show({message: 'Pin me', duration: 10000});
            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;

            notification.dispatchEvent(new Event('mouseenter'));

            expect(container.querySelector('.exo-toast-spacer')).toBeTruthy();
            expect(notification.style.position).toBe('absolute');
        });

        it('should remove spacer and unpin on mouseleave', () => {
            vi.useFakeTimers();

            Notifications.show({message: 'Pin me', duration: 10000});
            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;

            notification.dispatchEvent(new Event('mouseenter'));
            expect(container.querySelector('.exo-toast-spacer')).toBeTruthy();

            notification.dispatchEvent(new Event('mouseleave'));
            expect(container.querySelector('.exo-toast-spacer')).toBeFalsy();
            expect(notification.style.position).toBe('relative');

            vi.useRealTimers();
        });

        it('should clean up spacer when notification is dismissed while hovered', () => {
            vi.useFakeTimers();

            Notifications.show({message: 'Click me', duration: 10000});
            const notification = container.querySelector('.chrome-ext-notification') as HTMLElement;

            notification.dispatchEvent(new Event('mouseenter'));
            expect(container.querySelector('.exo-toast-spacer')).toBeTruthy();

            notification.click();
            vi.advanceTimersByTime(300);

            expect(container.querySelector('.exo-toast-spacer')).toBeFalsy();
            expect(container.querySelector('.chrome-ext-notification')).toBeFalsy();

            vi.useRealTimers();
        });
    });

    describe('per-notification independence', () => {
        it('should dismiss each notification independently via animationend', () => {
            vi.useFakeTimers();

            Notifications.show({message: 'First', duration: 1000});
            Notifications.show({message: 'Second', duration: 5000});

            const notifications = container.querySelectorAll('.chrome-ext-notification');
            expect(notifications.length).toBe(2);

            // First animation ends
            finishTimerBar(notifications[0] as HTMLElement);
            vi.advanceTimersByTime(300);

            const remaining = container.querySelectorAll('.chrome-ext-notification');
            expect(remaining.length).toBe(1);
            expect(remaining[0].textContent).toBe('Second');

            // Second animation ends
            finishTimerBar(remaining[0] as HTMLElement);
            vi.advanceTimersByTime(300);
            expect(container.querySelectorAll('.chrome-ext-notification').length).toBe(0);

            vi.useRealTimers();
        });

        it('should not dismiss hovered notification when sibling animation ends', () => {
            vi.useFakeTimers();

            Notifications.show({message: 'First', duration: 1000});
            Notifications.show({message: 'Hovered', duration: 1000});

            const notifications = container.querySelectorAll('.chrome-ext-notification');
            const hovered = notifications[1] as HTMLElement;

            // Hover second notification (pauses its animation)
            hovered.dispatchEvent(new Event('mouseenter'));

            // First's animation ends
            finishTimerBar(notifications[0] as HTMLElement);
            vi.advanceTimersByTime(300);

            const remaining = container.querySelectorAll('.chrome-ext-notification');
            expect(remaining.length).toBe(1);
            expect(remaining[0].textContent).toBe('Hovered');

            vi.useRealTimers();
        });
    });
});
