export class Notifications {
    private static container: HTMLElement | null = null;
    private static currentNotification: HTMLElement | null = null;
    private static pendingRemoval: number | null = null;

    /**
     * Show a toast notification
     */
    static show(message: string, duration: number = 3000): void {
        this.showRichNotification(message, 'default', duration);
    }

    /**
     * Show a rich notification with color and structure
     */
    static showRichNotification(
        message: string,
        type: 'success' | 'error' | 'default' = 'default',
        duration: number = 3000,
        options?: {
            replace?: boolean;
            opacity?: number;
            preview?: string;
            detail?: string;
        },
    ): void {
        // Use existing container if present (for testing)
        if (!this.container) {
            this.container = document.getElementById('notification-container');
        }
        if (!this.container) {
            this.createContainer();
        }

        // If replace is true, remove current notification immediately
        if (options?.replace && this.currentNotification) {
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
            backgroundColor = 'rgba(34, 197, 94, 0.9)'; // green
        } else if (type === 'error') {
            backgroundColor = 'rgba(239, 68, 68, 0.9)'; // red
        } else {
            backgroundColor = 'rgba(0, 0, 0, 0.8)';
        }

        // Apply opacity if specified (for fallback handlers)
        const opacity = options?.opacity ?? 1;
        if (opacity !== 1) {
            backgroundColor = backgroundColor.replace(/[\d.]+\)$/, `${0.8 * opacity})`);
        }

        notification.style.cssText = `
            padding: 12px 16px;
            margin-bottom: 8px;
            background: ${backgroundColor};
            color: white;
            border-radius: 4px;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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
        if (options?.detail) {
            const detailBlock = document.createElement('pre');
            detailBlock.textContent = options.detail;
            detailBlock.style.cssText = `
                font-size: 11px;
                margin: 8px 0 0 0;
                padding: 8px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 3px;
                white-space: pre;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                line-height: 1.5;
            `;
            notification.appendChild(detailBlock);
        }

        // Add preview text if provided (for cycle preview)
        if (options?.preview) {
            const previewText = document.createElement('div');
            previewText.textContent = options.preview;
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
