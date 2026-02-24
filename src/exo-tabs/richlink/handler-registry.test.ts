import {describe, it, expect, beforeEach} from 'vitest';
import {HandlerRegistry} from '@exo/exo-tabs/richlink/handler-registry';
import {Handler} from '@exo/exo-tabs/richlink/base';

class SpecializedHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('github.com');
    }
    getLabel(): string {
        return 'GitHub';
    }
    extractTitle(): string {
        return 'GitHub';
    }
    getPriority(): number {
        return 10;
    }
}

class FallbackHandler extends Handler {
    canHandle(_url: string): boolean {
        return true;
    }
    getLabel(): string {
        return 'Fallback';
    }
    extractTitle(): string {
        return 'Fallback';
    }
    getPriority(): number {
        return 100;
    }
    isFallback(): boolean {
        return true;
    }
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

        const formats = await HandlerRegistry.getAllFormats('https://github.com/repo');
        expect(formats).toHaveLength(2);
        expect(formats[0].label).toBe('GitHub');
        expect(formats[1].label).toBe('Fallback');
    });
});
