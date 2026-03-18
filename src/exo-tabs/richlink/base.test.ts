import {describe, it, expect, beforeEach} from 'vitest';
import {Handler} from '@exo/exo-tabs/richlink/base';

class TestHandler extends Handler {
    readonly label = 'Test Handler';
    readonly priority = 10;

    canHandle(url: URL): boolean {
        return url.hostname === 'test.com';
    }
}

describe('Handler', () => {
    beforeEach(() => {
        document.title = 'Test Page';
    });

    it('getFormats uses label, priority, extractLinkText, and url', () => {
        const handler = new TestHandler();
        const url = 'https://test.com/page';
        const format = handler.getFormats({url})[0];
        expect(format).toEqual({
            label: 'Test Handler',
            priority: 10,
            html: `<a href="${url}">Test Page</a>`,
            text: `Test Page (${url})`,
        });
    });

    it('isFallback defaults to false', () => {
        expect(new TestHandler().isFallback).toBe(false);
    });

    it('canHandle checks URL', () => {
        const handler = new TestHandler();
        expect(handler.canHandle(new URL('https://test.com/page'))).toBe(true);
        expect(handler.canHandle(new URL('https://other.com/page'))).toBe(false);
    });
});
