import {describe, it, expect, vi, beforeEach} from 'vitest';
import {Clipboard} from '@exo/lib/clipboard';
import {HandlerRegistry} from '@exo/exo-tabs/richlink/handlers';
import {handleCopyRichLink} from '@exo/exo-tabs/richlink/page';

/**
 * The popup fetches formats via GetFormatsAction → HandlerRegistry.getAllFormats(url).
 * The copy handler (handleCopyRichLink) internally calls the same getAllFormats,
 * picks formats[i], and writes format.text / format.html to the clipboard.
 *
 * These tests exercise both codepaths and zip their outputs together:
 * for each format the popup would display, call handleCopyRichLink with that
 * formatIndex, then assert the clipboard received the matching text and html.
 */

vi.mock('@exo/lib/clipboard', () => ({
    Clipboard: {write: vi.fn()},
}));
vi.mock('@exo/lib/toast-notification', () => ({
    Notifications: {show: vi.fn()},
}));
vi.mock('@exo/exo-tabs/richlink/copy-counter', () => ({
    CopyCounter: {increment: vi.fn(), getCount: vi.fn().mockResolvedValue(0)},
}));
vi.mock('@exo/exo-tabs/richlink/format-cycling', () => ({
    CACHE_EXPIRY_MS: 3000,
    getNextFormatIndex: vi.fn().mockReturnValue(0),
    cacheFormatIndex: vi.fn(),
    isCycling: vi.fn().mockReturnValue(false),
}));

const dummySender = {} as chrome.runtime.MessageSender;

describe('popup/page format parity', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.mocked(Clipboard.write).mockClear();
    });

    it('GitHub PR: every popup format matches what gets copied', async () => {
        const titleEl = document.createElement('span');
        titleEl.className = 'markdown-title';
        titleEl.textContent = 'Fix auth flow';
        document.body.appendChild(titleEl);

        const url = 'https://github.com/org/repo/pull/42';
        const popupFormats = HandlerRegistry.getAllFormats(url);

        for (let i = 0; i < popupFormats.length; i++) {
            vi.mocked(Clipboard.write).mockClear();
            const result = await handleCopyRichLink(
                {url, formatIndex: i},
                dummySender,
                undefined as void,
            );

            expect(result.formatIndex).toBe(i);
            expect(result.totalFormats).toBe(popupFormats.length);
            expect(Clipboard.write).toHaveBeenCalledWith(
                popupFormats[i].text,
                popupFormats[i].html,
            );
        }
    });

    it('Airtable: every popup format matches what gets copied', async () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = 'LTT12345/Improve onboarding';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const url = 'https://airtable.com/appXYZ/tblABC';
        const popupFormats = HandlerRegistry.getAllFormats(url);

        for (let i = 0; i < popupFormats.length; i++) {
            vi.mocked(Clipboard.write).mockClear();
            const result = await handleCopyRichLink(
                {url, formatIndex: i},
                dummySender,
                undefined as void,
            );

            expect(result.formatIndex).toBe(i);
            expect(result.totalFormats).toBe(popupFormats.length);
            expect(Clipboard.write).toHaveBeenCalledWith(
                popupFormats[i].text,
                popupFormats[i].html,
            );
        }
    });

    it('plain URL (no specialized handler): fallback formats match', async () => {
        document.title = 'Example Page';

        const url = 'https://example.com/some-page';
        const popupFormats = HandlerRegistry.getAllFormats(url);

        for (let i = 0; i < popupFormats.length; i++) {
            vi.mocked(Clipboard.write).mockClear();
            const result = await handleCopyRichLink(
                {url, formatIndex: i},
                dummySender,
                undefined as void,
            );

            expect(result.formatIndex).toBe(i);
            expect(result.totalFormats).toBe(popupFormats.length);
            expect(Clipboard.write).toHaveBeenCalledWith(
                popupFormats[i].text,
                popupFormats[i].html,
            );
        }
    });
});
