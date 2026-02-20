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
    preview?: string;
    detail?: string;
    onClick?: (notification: HTMLElement) => void;
}

export class Notifications {
    private static container: HTMLElement | null = null;
    private static currentNotification: HTMLElement | null = null;
    private static keyframesInjected = false;
    private static pinCleanups = new WeakMap<HTMLElement, () => void>();

    /**
     * Show a toast notification.
     * Accepts an options object or a plain string (treated as message with defaults).
     */
    static show(options: NotificationOptions | string): void {
        const opts: NotificationOptions =
            typeof options === 'string' ? {message: options} : options;

        const {
            message,
            type = NotificationType.Success,
            duration = DEFAULT_DURATION_MS,
            replace,
            opacity,
            preview,
            detail,
            onClick,
        } = opts;

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

        // Determine background color based on type
        let backgroundColor: string;
        if (type === 'success') {
            backgroundColor = theme.toast.successBg;
        } else if (type === 'error') {
            backgroundColor = theme.toast.errorBg;
        } else {
            backgroundColor = theme.toast.defaultBg;
        }

        // Apply opacity if specified (for fallback handlers), default to 0.95
        const effectiveOpacity = opacity ?? 0.95;
        if (effectiveOpacity !== 1) {
            backgroundColor = backgroundColor.replace(/[\d.]+\)$/, `${0.8 * effectiveOpacity})`);
        }

        notification.style.cssText = `
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
            opacity: ${effectiveOpacity};
            transform: translateX(0);
            overflow: hidden;
            box-sizing: border-box;
            ${onClick ? 'cursor: pointer;' : ''}
        `;

        // Create main message
        const mainText = document.createElement('div');
        mainText.textContent = message;
        mainText.style.cssText = 'font-weight: 500;';
        notification.appendChild(mainText);

        // Add detail block if provided (pre-formatted)
        if (detail) {
            const detailBlock = document.createElement('pre');
            detailBlock.textContent = detail;
            detailBlock.style.cssText = `
                font-size: ${theme.toast.detailFontSize};
                margin: 8px 0 0 0;
                padding: ${theme.toast.detailPadding};
                background: ${theme.toast.detailBg};
                border-radius: ${theme.toast.detailBorderRadius};
                white-space: pre;
                font-family: ${theme.toast.detailFontFamily};
                line-height: 1.5;
            `;
            notification.appendChild(detailBlock);
        }

        // Add preview text if provided (for cycle preview)
        if (preview) {
            const previewText = document.createElement('div');
            previewText.textContent = preview;
            previewText.style.cssText = `
                font-size: ${theme.toast.previewFontSize};
                margin-top: 4px;
                opacity: ${theme.toast.previewOpacity};
            `;
            notification.appendChild(previewText);
        }

        // Timer bar — CSS animation is the single source of truth for auto-dismiss
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
        notification.appendChild(timerBar);

        // When the timer bar animation completes, dismiss the notification
        let dismissing = false;
        timerBar.addEventListener('animationend', () => {
            dismissing = true;
            this.dismiss(notification);
        });

        // Close button (only when onClick is provided)
        if (onClick) {
            const closeBtn = document.createElement('span');
            closeBtn.textContent = '⏸︎';
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
            notification.appendChild(closeBtn);
        }

        // --- Per-notification hover/pause state (closure) ---
        let paused = false;
        let pausedLabel: HTMLElement | null = null;
        let spacer: HTMLElement | null = null;
        let layoutObserver: MutationObserver | null = null;
        let pinnedTop = 0;
        let pinnedHeight = 0;

        const cleanupPin = () => {
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
        this.pinCleanups.set(notification, cleanupPin);

        // Right-click pause toggle
        notification.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            paused = !paused;
            if (paused) {
                timerBar.style.animationPlayState = 'paused';
                notification.style.opacity = '1';
                notification.style.background = hoverBg;
                pausedLabel = document.createElement('span');
                pausedLabel.textContent = '\u23F8';
                pausedLabel.style.cssText = `
                    position: absolute;
                    bottom: 4px;
                    right: 8px;
                    font-size: 10px;
                    color: hsla(0, 0%, 100%, 1);
                    pointer-events: none;
                `;
                notification.appendChild(pausedLabel);
            } else {
                timerBar.style.animationPlayState = 'running';
                notification.style.opacity = String(effectiveOpacity);
                notification.style.background = backgroundColor;
                if (pausedLabel) {
                    pausedLabel.remove();
                    pausedLabel = null;
                }
            }
        });

        // Click behavior (left-click only)
        notification.addEventListener('click', (e) => {
            if (e.button !== 0) return;
            cleanupPin();
            if (onClick) {
                onClick(notification);
            } else {
                this.dismiss(notification);
            }
        });

        // Fully opaque background for hover state
        const hoverBg = backgroundColor.replace(/[\d.]+\)$/, '1)');

        // Hover: pin position, pause animation, pop visually
        notification.addEventListener('mouseenter', () => {
            if (dismissing) return;

            // Pin notification to prevent layout shift from sibling removal
            if (!spacer && this.container) {
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
                layoutObserver.observe(this.container, {childList: true});
            }

            // Visual pop
            notification.style.opacity = '1';
            notification.style.background = hoverBg;
            notification.style.transform = 'translateX(0)';
            notification.style.boxShadow = theme.shadow.overlay;

            if (paused) return;
            timerBar.style.animationPlayState = 'paused';
        });

        notification.addEventListener('mouseleave', () => {
            cleanupPin();

            notification.style.opacity = String(effectiveOpacity);
            notification.style.background = backgroundColor;
            notification.style.transform = 'translateX(0)';
            notification.style.boxShadow = theme.shadow.sm;

            if (paused) return;

            // Resume timer bar animation from where it was paused
            timerBar.style.animationPlayState = 'running';
        });

        this.container!.appendChild(notification);
        this.currentNotification = notification;
    }

    /**
     * @deprecated Use show() with options object instead
     */
    static showRichNotification(
        message: string,
        type: NotificationType = NotificationType.Default,
        duration: number = DEFAULT_DURATION_MS,
        options?: {
            replace?: boolean;
            opacity?: number;
            preview?: string;
            detail?: string;
        },
    ): void {
        this.show({message, type, duration, ...options});
    }

    private static dismiss(notification: HTMLElement, immediate?: boolean): void {
        // Stop timer bar animation to prevent animationend from re-firing
        const timerBar = notification.querySelector('.exo-toast-timer-bar') as HTMLElement | null;
        if (timerBar) timerBar.style.animation = 'none';

        // Clean up pin spacer if present
        const cleanupPin = this.pinCleanups.get(notification);
        if (cleanupPin) cleanupPin();

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
