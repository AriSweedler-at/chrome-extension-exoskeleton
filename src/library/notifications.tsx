import {theme} from '../theme/default';

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
}

export class Notifications {
    private static container: HTMLElement | null = null;
    private static currentNotification: HTMLElement | null = null;
    private static pendingRemoval: number | null = null;

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
            // Cancel pending fade-out animation
            if (this.pendingRemoval) {
                clearTimeout(this.pendingRemoval);
                this.pendingRemoval = null;
            }

            // Remove immediately without animation
            if (this.currentNotification.parentNode) {
                this.currentNotification.parentNode.removeChild(this.currentNotification);
            }
            this.currentNotification = null;
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
            backgroundColor = backgroundColor.replace(
                /[\d.]+\)$/,
                `${0.8 * effectiveOpacity})`,
            );
        }

        notification.style.cssText = `
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

        this.container!.appendChild(notification);
        this.currentNotification = notification;

        this.pendingRemoval = window.setTimeout(() => {
            // Start fade-out animation
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(20px)';

            // Remove from DOM after animation completes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    if (this.currentNotification === notification) {
                        this.currentNotification = null;
                    }
                }
                this.pendingRemoval = null;
            }, 300);
        }, duration);
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
