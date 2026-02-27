import {Handler, LinkFormat} from '@exo/exo-tabs/richlink/base';

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
        return this.specializedHandlers.some((h) => h.canHandle(url));
    }

    static getAllFormats(url: string): LinkFormat[] {
        const specialized = this.specializedHandlers.filter((h) => h.canHandle(url));
        const combined = [...specialized, ...this.baseHandlers];
        return combined.flatMap((h) => h.getFormats({url})).sort((a, b) => a.priority - b.priority);
    }
}
