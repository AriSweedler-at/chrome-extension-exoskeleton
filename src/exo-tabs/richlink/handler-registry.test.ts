import {describe, it, expect, beforeEach} from 'vitest';
import {HandlerRegistry} from '@exo/exo-tabs/richlink/handler-registry';
import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

class SpecializedHandler extends Handler {
    canHandle(url: URL): boolean {
        return url.href.includes('github.com');
    }
    getFormats(_ctx: FormatContext): LinkFormat[] {
        return [
            {
                label: 'GitHub',
                priority: 10,
                html: '<a href="">GitHub</a>',
                text: 'GitHub',
            },
        ];
    }
}

class FallbackHandler extends Handler {
    canHandle(_url: URL): boolean {
        return true;
    }
    getFormats(_ctx: FormatContext): LinkFormat[] {
        return [
            {
                label: 'Fallback',
                priority: 100,
                isFallback: true,
                html: '<a href="">Fallback</a>',
                text: 'Fallback',
            },
        ];
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

        const formats = HandlerRegistry.getAllFormats('https://github.com/repo');
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('GitHub');
    });

    it('should register base handlers', () => {
        const handler = new FallbackHandler();
        HandlerRegistry.register(handler);

        const formats = HandlerRegistry.getAllFormats('https://example.com');
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('Fallback');
    });

    it('should return formats in priority order', () => {
        const specialized = new SpecializedHandler();
        const fallback = new FallbackHandler();

        HandlerRegistry.register(specialized);
        HandlerRegistry.register(fallback);

        const formats = HandlerRegistry.getAllFormats('https://github.com/repo');
        expect(formats).toHaveLength(2);
        expect(formats[0].label).toBe('GitHub'); // Lower priority (10) comes first
        expect(formats[1].label).toBe('Fallback');
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
