import {describe, it, expect, beforeEach, vi} from 'vitest';
import {HandlerRegistry} from '@exo/exo-tabs/richlink/handlers';

describe('Rich Link Integration', () => {
    beforeEach(() => {
        // Mock DOM
        vi.stubGlobal('document', {
            title: 'Test Page',
            querySelector: vi.fn(),
        });
        vi.stubGlobal('window', {
            location: {
                href: 'https://github.com/user/repo/pull/123',
            },
        });
    });

    it('should load all handlers', () => {
        // GitHub handler matches PR URLs specifically
        expect(HandlerRegistry.hasSpecializedHandler('https://github.com/user/repo/pull/123')).toBe(
            true,
        );
        expect(HandlerRegistry.hasSpecializedHandler('https://example.com')).toBe(false);
    });

    it('should return formats in priority order', async () => {
        const formats = await HandlerRegistry.getAllFormats(
            'https://github.com/user/repo/pull/123',
        );
        expect(formats.length).toBeGreaterThan(0);

        // GitHub should be first (priority 10)
        expect(formats[0].label).toBe('GitHub PR');

        // Page Title should be second-to-last (priority 100)
        expect(formats[formats.length - 2].label).toBe('Page Title');

        // Raw URL should be last (priority 200)
        expect(formats[formats.length - 1].label).toBe('Raw URL');
    });

    it('should fallback to base handlers on unsupported sites', async () => {
        const formats = await HandlerRegistry.getAllFormats('https://example.com');

        // Should only have base handlers
        expect(formats).toHaveLength(2);
        expect(formats[0].label).toBe('Page Title');
        expect(formats[1].label).toBe('Raw URL');
    });
});
