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
    private static pendingRemoval: number | null = null;
    private static pendingRemovalStart: number = 0;
    private static pendingRemovalRemaining: number = 0;

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
            backgroundColor = theme.toast.successBg; // green
        } else if (type === 'error') {
            backgroundColor = theme.toast.errorBg; // red
        } else {
            backgroundColor = theme.toast.defaultBg;
        }

        // Apply opacity if specified (for fallback handlers)
        const effectiveOpacity = opacity ?? 1;
        if (effectiveOpacity !== 1) {
            backgroundColor = backgroundColor.replace(/[\d.]+\)$/, `${0.8 * effectiveOpacity})`);
        }

        notification.style.cssText = `
            position: relative;
            padding: 12px 16px;
            margin-bottom: 8px;
            background: ${backgroundColor};
            color: white;
            border-radius: 4px;
            font-size: 14px;
            box-shadow: ${theme.shadow.sm};
            line-height: 1.4;
            transition: opacity 0.3s ease-out, transform 0.3s ease-out;
            opacity: 1;
            transform: translateX(0);
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
                font-size: 11px;
                margin: 8px 0 0 0;
                padding: 8px;
                background: ${theme.toast.detailBg};
                border-radius: 3px;
                white-space: pre;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                line-height: 1.5;
            `;
            notification.appendChild(detailBlock);
        }

        // Add preview text if provided (for cycle preview)
        if (preview) {
            const previewText = document.createElement('div');
            previewText.textContent = preview;
            previewText.style.cssText = `
                font-size: 11px;
                margin-top: 4px;
                opacity: 0.7;
            `;
            notification.appendChild(previewText);
        }

        // Close button (only when onClick is provided)
        if (onClick) {
            const closeBtn = document.createElement('span');
            closeBtn.textContent = '\u00d7';
            closeBtn.style.cssText = `
                position: absolute;
                top: 4px;
                right: 8px;
                font-size: 16px;
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
                this.dismiss(notification);
            });
            notification.appendChild(closeBtn);
        }

        // Click behavior
        notification.addEventListener('click', () => {
            if (onClick) {
                onClick(notification);
            } else {
                this.dismiss(notification);
            }
        });

        // Hover pauses auto-dismiss
        notification.addEventListener('mouseenter', () => {
            if (this.pendingRemoval) {
                this.pendingRemovalRemaining -= Date.now() - this.pendingRemovalStart;
                clearTimeout(this.pendingRemoval);
                this.pendingRemoval = null;
            }
        });
        notification.addEventListener('mouseleave', () => {
            if (this.currentNotification === notification && !this.pendingRemoval) {
                this.startFadeOut(notification, this.pendingRemovalRemaining);
            }
        });

        this.container!.appendChild(notification);
        this.currentNotification = notification;

        this.startFadeOut(notification, duration);
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

    private static startFadeOut(notification: HTMLElement, delay: number): void {
        this.pendingRemovalStart = Date.now();
        this.pendingRemovalRemaining = delay;
        this.pendingRemoval = window.setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    if (this.currentNotification === notification) {
                        this.currentNotification = null;
                    }
                }
                this.pendingRemoval = null;
            }, 300);
        }, delay);
    }

    private static dismiss(notification: HTMLElement, immediate?: boolean): void {
        if (this.pendingRemoval) {
            clearTimeout(this.pendingRemoval);
            this.pendingRemoval = null;
        }

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
        }, 300);
    }

    private static createContainer(): void {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 10000;
            min-width: 200px;
            max-width: max-content;
        `;
        document.body.appendChild(this.container);
    }
}
