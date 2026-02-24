import {Handler, LinkFormat} from '@exo/exo-tabs/richlink/base';

export class HandlerRegistry {
    private static baseHandlers: Handler[] = [];
    private static specializedHandlers: Handler[] = [];

    static register(handler: Handler): void {
        if (handler.isFallback()) {
            this.baseHandlers.push(handler);
            this.baseHandlers.sort((a, b) => a.priority - b.priority);
        } else {
            this.specializedHandlers.push(handler);
            this.specializedHandlers.sort((a, b) => a.priority - b.priority);
        }
    }

    static getHandlersForUrl(url: string): Handler[] {
        const specialized = this.specializedHandlers.filter((h) => h.canHandle(url));
        const combined = [...specialized, ...this.baseHandlers];
        return combined.sort((a, b) => a.priority - b.priority);
    }

    static hasSpecializedHandler(url: string): boolean {
        return this.specializedHandlers.some((h) => h.canHandle(url));
    }

    static async getAllFormats(url: string): Promise<LinkFormat[]> {
        const handlers = this.getHandlersForUrl(url);
        return await Promise.all(handlers.map((h) => h.getFormat()));
    }
}
