import {describe, it, expect, beforeEach} from 'vitest';
import {HandlerRegistry} from '@exo/exo-tabs/richlink/handler-registry';
import {Handler, type FormatContext} from '@exo/exo-tabs/richlink/base';

class SpecializedHandler extends Handler {
    readonly label = 'GitHub';
    readonly priority = 10;
    canHandle(url: string): boolean {
        return url.includes('github.com');
    }
    extractLinkText(_ctx: FormatContext): string {
        return 'GitHub';
    }
}

class FallbackHandler extends Handler {
    readonly label = 'Fallback';
    readonly priority = 100;
    canHandle(_url: string): boolean {
        return true;
    }
    extractLinkText(_ctx: FormatContext): string {
        return 'Fallback';
    }
    override readonly isFallback = true;
}

describe('HandlerRegistry', () => {
    beforeEach(() => {
        // Clear registry before each test
        HandlerRegistry['baseHandlers'] = [];
        HandlerRegistry['specializedHandlers'] = [];
    });

    it('should register specialized handlers', () => {
        const handler = new SpecializedHandler();
        HandlerRegistry.register(handler);

        const handlers = HandlerRegistry.getHandlersForUrl('https://github.com/repo');
        expect(handlers).toHaveLength(1);
        expect(handlers[0]).toBe(handler);
    });

    it('should register base handlers', () => {
        const handler = new FallbackHandler();
        HandlerRegistry.register(handler);

        const handlers = HandlerRegistry.getHandlersForUrl('https://example.com');
        expect(handlers).toHaveLength(1);
        expect(handlers[0]).toBe(handler);
    });

    it('should return handlers in priority order', () => {
        const specialized = new SpecializedHandler();
        const fallback = new FallbackHandler();

        HandlerRegistry.register(specialized);
        HandlerRegistry.register(fallback);

        const handlers = HandlerRegistry.getHandlersForUrl('https://github.com/repo');
        expect(handlers).toHaveLength(2);
        expect(handlers[0]).toBe(specialized); // Lower priority (10) comes first
        expect(handlers[1]).toBe(fallback);
    });

    it('should detect specialized handlers', () => {
        const specialized = new SpecializedHandler();
        const fallback = new FallbackHandler();

        HandlerRegistry.register(specialized);
        HandlerRegistry.register(fallback);

        expect(HandlerRegistry.hasSpecializedHandler('https://github.com/repo')).toBe(true);
        expect(HandlerRegistry.hasSpecializedHandler('https://example.com')).toBe(false);
    });

    it('should get all formats from matching handlers', async () => {
        const specialized = new SpecializedHandler();
        const fallback = new FallbackHandler();

        HandlerRegistry.register(specialized);
        HandlerRegistry.register(fallback);

        const formats = HandlerRegistry.getAllFormats('https://github.com/repo');
        expect(formats).toHaveLength(2);
        expect(formats[0].label).toBe('GitHub');
        expect(formats[1].label).toBe('Fallback');
    });
});
