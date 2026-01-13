import {describe, it, expect, beforeEach, vi} from 'vitest';
import {Clipboard} from '../../src/library/clipboard';

describe('Clipboard', () => {
    beforeEach(() => {
        // Mock ClipboardItem
        global.ClipboardItem = class ClipboardItem {
            constructor(public data: Record<string, Blob>) {}
        } as any;

        // Mock navigator.clipboard
        Object.assign(navigator, {
            clipboard: {
                write: vi.fn(),
                writeText: vi.fn(),
            },
        });
    });

    describe('write', () => {
        it('should write text to clipboard', async () => {
            (navigator.clipboard.writeText as any).mockResolvedValue(undefined);

            await Clipboard.write('Hello World');

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello World');
        });

        it('should write both text and HTML to clipboard', async () => {
            const clipboardItems: ClipboardItem[] = [];
            (navigator.clipboard.write as any).mockImplementation((items: ClipboardItem[]) => {
                clipboardItems.push(...items);
                return Promise.resolve();
            });

            await Clipboard.write('Hello', '<p>Hello</p>');

            expect(navigator.clipboard.write).toHaveBeenCalled();
            expect(clipboardItems).toHaveLength(1);
        });

        it('should reject if clipboard API fails', async () => {
            (navigator.clipboard.writeText as any).mockRejectedValue(
                new Error('Clipboard access denied'),
            );

            await expect(Clipboard.write('test')).rejects.toThrow(
                'Clipboard access denied',
            );
        });
    });
});
