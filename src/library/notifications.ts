export class Notifications {
    private static container: HTMLElement | null = null;

    /**
     * Show a toast notification
     */
    static show(message: string, duration: number = 3000): void {
        // Use existing container if present (for testing)
        if (!this.container) {
            this.container = document.getElementById('notification-container');
        }
        if (!this.container) {
            this.createContainer();
        }

        const notification = document.createElement('div');
        notification.className = 'chrome-ext-notification';
        notification.textContent = message;
        notification.style.cssText = `
            padding: 12px 16px;
            margin-bottom: 8px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 4px;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;

        this.container!.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
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
            max-width: 400px;
        `;
        document.body.appendChild(this.container);
    }
}
