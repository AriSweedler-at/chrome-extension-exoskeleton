import {describe, it, expect, beforeEach, vi} from 'vitest';
import {PageTitleHandler} from '@exo/library/richlink/handlers/page-title.handler';

describe('PageTitleHandler', () => {
    let handler: PageTitleHandler;

    beforeEach(() => {
        handler = new PageTitleHandler();
        // Mock document
        vi.stubGlobal('document', {
            title: 'Test Page Title',
        });
        vi.stubGlobal('window', {
            location: {
                href: 'https://example.com/page',
            },
        });
    });

    it('should handle any URL', () => {
        expect(handler.canHandle('https://example.com')).toBe(true);
        expect(handler.canHandle('https://github.com')).toBe(true);
        expect(handler.canHandle('chrome://extensions')).toBe(true);
    });

    it('should be a fallback handler', () => {
        expect(handler.isFallback()).toBe(true);
    });

    it('should have priority 100', () => {
        expect(handler.getPriority()).toBe(100);
    });

    it('should return "Page Title" as label', () => {
        expect(handler.getLabel()).toBe('Page Title');
    });

    it('should extract page title from document', async () => {
        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://example.com/page">Test Page Title</a>');

        const text = await handler.getText();
        expect(text).toBe('Test Page Title (https://example.com/page)');
    });

    it('should handle missing title', async () => {
        vi.stubGlobal('document', {title: ''});

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://example.com/page">Untitled</a>');
    });
});
