import {describe, it, expect} from 'vitest';
import {Handler, LinkFormat} from '../../../src/library/richlink/base';

class TestHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('test.com');
    }

    getLabel(): string {
        return 'Test Handler';
    }

    async getHtml(): Promise<string> {
        return '<a href="https://test.com">Test</a>';
    }

    async getText(): Promise<string> {
        return 'Test (https://test.com)';
    }

    getPriority(): number {
        return 10;
    }
}

describe('Handler', () => {
    it('getFormat should return LinkFormat', async () => {
        const handler = new TestHandler();
        const format = await handler.getFormat();

        expect(format).toEqual({
            label: 'Test Handler',
            html: '<a href="https://test.com">Test</a>',
            text: 'Test (https://test.com)',
        });
    });

    it('isFallback should default to false', () => {
        const handler = new TestHandler();
        expect(handler.isFallback()).toBe(false);
    });

    it('canHandle should check URL', () => {
        const handler = new TestHandler();
        expect(handler.canHandle('https://test.com/page')).toBe(true);
        expect(handler.canHandle('https://other.com/page')).toBe(false);
    });
});
