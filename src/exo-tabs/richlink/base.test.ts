import {describe, it, expect} from 'vitest';
import {Handler, type FormatContext} from '@exo/exo-tabs/richlink/base';

class TestHandler extends Handler {
    readonly label = 'Test Handler';
    readonly priority = 10;

    canHandle(url: string): boolean {
        return url.includes('test.com');
    }

    extractLinkText(_ctx: FormatContext): string {
        return 'Test';
    }
}

describe('Handler', () => {
    it('getFormat should return LinkFormat', () => {
        const handler = new TestHandler();
        const format = handler.getFormat({url: window.location.href});

        const url = window.location.href;
        expect(format).toEqual({
            label: 'Test Handler',
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
        expect(handler.canHandle('https://test.com/page')).toBe(true);
        expect(handler.canHandle('https://other.com/page')).toBe(false);
    });
});
