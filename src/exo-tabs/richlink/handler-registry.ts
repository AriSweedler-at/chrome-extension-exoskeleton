import {Handler, type LinkFormat} from '@exo/exo-tabs/richlink/base';
import {cleanUrl} from '@exo/exo-tabs/richlink/clean-url';
import {safeUrl} from '@exo/lib/url';

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
        const parsed = safeUrl(url);
        return parsed !== null && this.specializedHandlers.some((h) => h.canHandle(parsed));
    }

    static getAllFormats(url: string): LinkFormat[] {
        const parsed = safeUrl(url);
        if (!parsed) return [];
        const cleaned = cleanUrl(url);
        const specialized = this.specializedHandlers.filter((h) => h.canHandle(parsed));
        const combined = [...specialized, ...this.baseHandlers];
        return combined
            .flatMap((h) => h.getFormats({url: cleaned}))
            .sort((a, b) => a.priority - b.priority);
    }
}
