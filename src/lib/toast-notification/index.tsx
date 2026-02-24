import type {ReactNode} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {theme} from '@exo/theme/default';

const DEFAULT_DURATION_MS = 5000;

export enum NotificationType {
    Success = 'success',
    Error = 'error',
    Default = 'default',
}

export interface NotificationOptions {
    message: string;
    type?: NotificationType;
    duration?: number;
    replace?: boolean;
    opacity?: number;
    children?: ReactNode;
    onClick?: (notification: HTMLElement) => void;
}

/**
 * Create a layout pin for a notification element.
 * Prevents layout shift when sibling notifications are removed by pinning
 * the notification in place and inserting a spacer element.
 */
function createLayoutPin(notification: HTMLElement, container: HTMLElement) {
    let spacer: HTMLElement | null = null;
    let layoutObserver: MutationObserver | null = null;
    let pinnedTop = 0;
    let pinnedHeight = 0;

    const cleanup = () => {
        if (layoutObserver) {
            layoutObserver.disconnect();
            layoutObserver = null;
        }
        if (spacer) {
            spacer.remove();
            spacer = null;
        }
        notification.style.position = 'relative';
        notification.style.top = '';
        notification.style.left = '';
        notification.style.right = '';
    };

    const pin = () => {
        if (spacer) return;

        pinnedTop = notification.offsetTop;
        pinnedHeight = notification.offsetHeight;
        const rect = notification.getBoundingClientRect();

        spacer = document.createElement('div');
        spacer.className = 'exo-toast-spacer';
        spacer.style.cssText = `
            height: ${pinnedHeight}px;
            min-width: ${rect.width}px;
            margin-bottom: ${theme.toast.marginBottom};
        `;
        notification.parentNode!.insertBefore(spacer, notification);
        notification.style.position = 'absolute';
        notification.style.top = `${pinnedTop}px`;
        notification.style.left = '0';
        notification.style.right = '0';

        layoutObserver = new MutationObserver(() => {
            if (!spacer) return;
            const spacerTop = spacer.offsetTop;
            if (spacerTop > pinnedTop) {
                pinnedTop = spacerTop;
                notification.style.top = `${spacerTop}px`;
            }
            spacer.style.height = `${pinnedTop + pinnedHeight - spacerTop}px`;
        });
        layoutObserver.observe(container, {childList: true});
    };

    return {pin, cleanup};
}

/**
 * Attach a right-click pause toggle to a notification.
 * Right-clicking pauses/resumes the timer bar animation and shows a pause indicator.
 */
function createPauseToggle(
    notification: HTMLElement,
    timerBar: HTMLElement,
    colors: {base: string; hover: string; opacity: number},
) {
    let paused = false;
    let label: HTMLElement | null = null;

    notification.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        paused = !paused;
        if (paused) {
            timerBar.style.animationPlayState = 'paused';
            notification.style.opacity = '1';
            notification.style.background = colors.hover;
            label = document.createElement('span');
            label.textContent = '\u23F8';
            label.style.cssText = `
                position: absolute;
                bottom: 4px;
                right: 8px;
                font-size: 10px;
                color: hsla(0, 0%, 100%, 1);
                pointer-events: none;
            `;
            notification.appendChild(label);
        } else {
            timerBar.style.animationPlayState = 'running';
            notification.style.opacity = String(colors.opacity);
            notification.style.background = colors.base;
            if (label) {
                label.remove();
                label = null;
            }
        }
    });

    return {isPaused: () => paused};
}

export class Notifications {
    private static container: HTMLElement | null = null;
    private static currentNotification: HTMLElement | null = null;
    private static keyframesInjected = false;
    private static pinCleanups = new WeakMap<HTMLElement, () => void>();
    private static reactRoots = new WeakMap<HTMLElement, Root>();

    /**
     * Show a toast notification.
     */
    static show(options: NotificationOptions): void {
        const {
            message,
            type = NotificationType.Success,
            duration = DEFAULT_DURATION_MS,
            replace,
            opacity = 0.95,
            children,
            onClick,
        } = options;

        console.log(`[exo toast] ${message}`);

        this.injectKeyframes();

        // Use existing container if present (for testing)
        if (!this.container) {
            this.container = document.getElementById('notification-container');
        }
        if (!this.container) {
            this.createContainer();
        }

        // If replace is true, remove current notification immediately
        if (replace && this.currentNotification) {
            this.dismiss(this.currentNotification, true);
        }

        const notification = document.createElement('div');
        notification.className = 'chrome-ext-notification';

        const {cssText, backgroundColor} = this.buildNotificationStyle(type, opacity);
        notification.style.cssText = cssText;

        notification.appendChild(this.createMessageElement(message));

        if (children) {
            this.renderChildren(notification, children);
        }

        // Timer bar — CSS animation is the single source of truth for auto-dismiss
        const timerBar = this.createTimerBar(duration);
        notification.appendChild(timerBar);

        const {isDismissing} = this.attachAutoDismiss(notification, timerBar);

        const {pin, cleanup: cleanupPin} = createLayoutPin(notification, this.container!);
        this.pinCleanups.set(notification, cleanupPin);

        const hoverBg = backgroundColor.replace(/[\d.]+\)$/, '1)');
        const {isPaused} = createPauseToggle(notification, timerBar, {
            base: backgroundColor,
            hover: hoverBg,
            opacity,
        });

        this.attachClickHandler(notification, cleanupPin, onClick);
        this.attachHoverHandlers(notification, timerBar, {
            pin,
            cleanupPin,
            isPaused,
            isDismissing,
            colors: {base: backgroundColor, hover: hoverBg, opacity},
        });

        this.container!.appendChild(notification);
        this.currentNotification = notification;
    }

    private static dismiss(notification: HTMLElement, immediate?: boolean): void {
        // Stop timer bar animation to prevent animationend from re-firing
        const timerBar = notification.querySelector('.exo-toast-timer-bar') as HTMLElement | null;
        if (timerBar) timerBar.style.animation = 'none';

        // Clean up pin spacer if present
        const cleanupPin = this.pinCleanups.get(notification);
        if (cleanupPin) cleanupPin();

        // Clean up React root if present
        const root = this.reactRoots.get(notification);
        if (root) root.unmount();

        if (immediate) {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (this.currentNotification === notification) {
                this.currentNotification = null;
            }
            return;
        }

        // Animated dismiss
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (this.currentNotification === notification) {
                this.currentNotification = null;
            }
        }, theme.toast.fadeMs);
    }

    private static attachClickHandler(
        notification: HTMLElement,
        cleanupPin: () => void,
        onClick?: (notification: HTMLElement) => void,
    ): void {
        if (onClick) {
            notification.appendChild(this.createCloseButton(notification, cleanupPin));
        }
        notification.addEventListener('click', (e) => {
            if (e.button !== 0) return;
            cleanupPin();
            if (onClick) {
                onClick(notification);
            } else {
                this.dismiss(notification);
            }
        });
    }

    private static attachHoverHandlers(
        notification: HTMLElement,
        timerBar: HTMLElement,
        opts: {
            pin: () => void;
            cleanupPin: () => void;
            isPaused: () => boolean;
            isDismissing: () => boolean;
            colors: {base: string; hover: string; opacity: number};
        },
    ): void {
        const {pin, cleanupPin, isPaused, isDismissing, colors} = opts;

        notification.addEventListener('mouseenter', () => {
            if (isDismissing()) return;
            pin();

            notification.style.opacity = '1';
            notification.style.background = colors.hover;
            notification.style.transform = 'translateX(0)';
            notification.style.boxShadow = theme.shadow.overlay;

            if (isPaused()) return;
            timerBar.style.animationPlayState = 'paused';
        });

        notification.addEventListener('mouseleave', () => {
            cleanupPin();

            notification.style.opacity = String(colors.opacity);
            notification.style.background = colors.base;
            notification.style.transform = 'translateX(0)';
            notification.style.boxShadow = theme.shadow.sm;

            if (isPaused()) return;
            timerBar.style.animationPlayState = 'running';
        });
    }

    private static buildNotificationStyle(
        type: NotificationType,
        opacity: number,
    ): {cssText: string; backgroundColor: string} {
        let backgroundColor = theme.toast.bg[type] as string;
        if (opacity !== 1) {
            backgroundColor = backgroundColor.replace(/[\d.]+\)$/, `${0.8 * opacity})`);
        }
        return {
            backgroundColor,
            cssText: `
                position: relative;
                padding: ${theme.toast.padding};
                margin-bottom: ${theme.toast.marginBottom};
                background: ${backgroundColor};
                color: ${theme.text.white};
                border-radius: ${theme.toast.borderRadius};
                font-size: ${theme.toast.fontSize};
                box-shadow: ${theme.shadow.sm};
                line-height: ${theme.toast.lineHeight};
                transition: opacity 0.3s ease-out, transform 0.3s ease-out, box-shadow 0.3s ease-out;
                opacity: ${opacity};
                transform: translateX(0);
                overflow: hidden;
                box-sizing: border-box;
                cursor: pointer;
            `,
        };
    }

    private static attachAutoDismiss(
        notification: HTMLElement,
        timerBar: HTMLElement,
    ): {isDismissing: () => boolean} {
        let dismissing = false;
        timerBar.addEventListener('animationend', () => {
            dismissing = true;
            this.dismiss(notification);
        });
        return {isDismissing: () => dismissing};
    }

    private static renderChildren(notification: HTMLElement, children: ReactNode): void {
        const container = document.createElement('div');
        notification.appendChild(container);
        const root = createRoot(container);
        root.render(children);
        this.reactRoots.set(notification, root);
    }

    private static createMessageElement(message: string): HTMLElement {
        const el = document.createElement('div');
        el.textContent = message;
        el.style.cssText = 'font-weight: 500;';
        return el;
    }

    private static createTimerBar(duration: number): HTMLElement {
        const timerBar = document.createElement('div');
        timerBar.className = 'exo-toast-timer-bar';
        timerBar.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            height: ${theme.toast.timerBarHeight};
            background: ${theme.toast.timerBarColor};
            border-radius: 0 0 ${theme.toast.borderRadius} ${theme.toast.borderRadius};
            animation: exo-toast-timer ${duration}ms linear forwards;
        `;
        return timerBar;
    }

    private static createCloseButton(
        notification: HTMLElement,
        cleanupPin: () => void,
    ): HTMLElement {
        const closeBtn = document.createElement('span');
        closeBtn.textContent = '\u23F8\uFE0E';
        closeBtn.style.cssText = `
            position: absolute;
            top: 4px;
            right: 8px;
            font-size: ${theme.toast.closeBtnFontSize};
            color: ${theme.toast.closeBtnDefault};
            cursor: pointer;
            line-height: 1;
        `;
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.color = theme.toast.closeBtnHover;
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.color = theme.toast.closeBtnDefault;
        });
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cleanupPin();
            this.dismiss(notification);
        });
        return closeBtn;
    }

    private static injectKeyframes(): void {
        if (this.keyframesInjected) return;
        const style = document.createElement('style');
        style.textContent = `
            @keyframes exo-toast-timer {
                from { width: 0%; }
                to { width: 100%; }
            }
        `;
        document.head.appendChild(style);
        this.keyframesInjected = true;
    }

    private static createContainer(): void {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: ${theme.toast.containerTop};
            right: ${theme.toast.containerRight};
            z-index: ${theme.toast.containerZIndex};
            min-width: ${theme.toast.containerMinWidth};
            max-width: max-content;
        `;
        document.body.appendChild(this.container);
    }
}
