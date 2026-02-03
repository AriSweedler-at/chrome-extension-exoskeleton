import {describe, it, expect, beforeEach, vi} from 'vitest';
import {RawUrlHandler} from '../../../../src/library/richlink/handlers/raw-url.handler';

describe('RawUrlHandler', () => {
    let handler: RawUrlHandler;

    beforeEach(() => {
        handler = new RawUrlHandler();
        vi.stubGlobal('window', {
            location: {
                href: 'https://example.com/page?query=test#anchor',
            },
        });
    });

    it('should handle any URL', () => {
        expect(handler.canHandle('https://example.com')).toBe(true);
        expect(handler.canHandle('https://github.com')).toBe(true);
    });

    it('should be a fallback handler', () => {
        expect(handler.isFallback()).toBe(true);
    });

    it('should have priority 200', () => {
        expect(handler.getPriority()).toBe(200);
    });

    it('should return "Raw URL" as label', () => {
        expect(handler.getLabel()).toBe('Raw URL');
    });

    it('should return raw URL for both html and text', async () => {
        const html = await handler.getHtml();
        expect(html).toBe('https://example.com/page?query=test#anchor');

        const text = await handler.getText();
        expect(text).toBe('https://example.com/page?query=test#anchor');
    });
});
