import {describe, it, expect} from 'vitest';
import {Handler} from '@exo/exo-tabs/richlink/base';

class TestHandler extends Handler {
    readonly label = 'Test Handler';
    readonly priority = 10;

    canHandle(url: URL): boolean {
        return url.href.includes('test.com');
    }

    extractLinkText(): string {
        return 'Test';
    }
}

describe('Handler', () => {
    it('getFormats should return LinkFormat[]', () => {
        const handler = new TestHandler();
        const format = handler.getFormats({url: window.location.href})[0];

        const url = window.location.href;
        expect(format).toEqual({
            label: 'Test Handler',
            priority: 10,
            html: `<a href="${url}">Test</a>`,
            text: `Test (${url})`,
        });
    });

    it('isFallback should default to false', () => {
        const handler = new TestHandler();
        expect(handler.isFallback).toBe(false);
    });

    it('canHandle should check URL', () => {
        const handler = new TestHandler();
        expect(handler.canHandle(new URL('https://test.com/page'))).toBe(true);
        expect(handler.canHandle(new URL('https://other.com/page'))).toBe(false);
    });
});
