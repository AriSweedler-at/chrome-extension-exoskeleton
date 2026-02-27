import {Handler, type LinkFormat} from '@exo/exo-tabs/richlink/base';

export class HandlerRegistry {
    private static baseHandlers: Handler[] = [];
    private static specializedHandlers: Handler[] = [];

    static register(handler: Handler): void {
        if (handler.isFallback) {
            this.baseHandlers.push(handler);
        } else {
            this.specializedHandlers.push(handler);
        }
    }

    static hasSpecializedHandler(url: string): boolean {
        try {
            const parsed = new URL(url);
            return this.specializedHandlers.some((h) => h.canHandle(parsed));
        } catch {
            return false;
        }
    }

    static getAllFormats(url: string): LinkFormat[] {
        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch {
            return [];
        }
        const specialized = this.specializedHandlers.filter((h) => h.canHandle(parsed));
        const combined = [...specialized, ...this.baseHandlers];
        return combined.flatMap((h) => h.getFormats({url})).sort((a, b) => a.priority - b.priority);
    }
}
