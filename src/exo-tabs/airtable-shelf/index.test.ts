import {describe, it, expect} from 'vitest';
import {isAirtableHost, parseShelfView, cameFromShelf} from '@exo/exo-tabs/airtable-shelf';

// The real thing: a listable open as a shelf on the SO SPRINT page. The
// detail payload decodes to {pageId: 'pagZzlssmtCQlD48M', rowId: 'recT5SYpFJs1ECUSK', ...}.
const SHELF_URL =
    'https://airtable.com/apptivTqaoebkrmV1/pagrDMUXa6uRzU6f6?detail=eyJwYWdlSWQiOiJwYWdaemxzc210Q1FsRDQ4TSIsInJvd0lkIjoicmVjVDVTWXBGSnMxRUNVU0siLCJzaG93Q29tbWVudHMiOmZhbHNlLCJxdWVyeU9yaWdpbkhpbnQiOm51bGx9&69ira=recQYuZGhCOacGrpx&SHDHb=rec4hPuRRvCu4oGcT';
const FULLSCREEN_URL = 'https://airtable.com/apptivTqaoebkrmV1/pagZzlssmtCQlD48M/recT5SYpFJs1ECUSK';

describe('isAirtableHost', () => {
    it('matches airtable.com and *.airtable.app', () => {
        expect(isAirtableHost('https://airtable.com/x')).toBe(true);
        expect(isAirtableHost('https://escalations.airtable.app/x')).toBe(true);
    });

    it('rejects other hosts and garbage', () => {
        expect(isAirtableHost('https://github.com/airtable.com')).toBe(false);
        expect(isAirtableHost('not-a-url')).toBe(false);
    });
});

describe('parseShelfView', () => {
    it('derives the fullscreen URL from a real shelf URL', () => {
        expect(parseShelfView(SHELF_URL)).toEqual({fullscreenUrl: FULLSCREEN_URL});
    });

    it('returns null for a fullscreen URL (record in the path, no detail)', () => {
        expect(parseShelfView(FULLSCREEN_URL)).toBeNull();
    });

    it('returns null when the detail payload has no pageId', () => {
        const detail = btoa(JSON.stringify({rowId: 'recT5SYpFJs1ECUSK'}));
        expect(
            parseShelfView(`https://airtable.com/apptivTqaoebkrmV1/pag123?detail=${detail}`),
        ).toBeNull();
    });

    it('returns null for malformed detail payloads', () => {
        expect(
            parseShelfView('https://airtable.com/apptivTqaoebkrmV1/pag123?detail=%%%not-base64'),
        ).toBeNull();
    });

    it('returns null off Airtable hosts and off app paths', () => {
        const detail = btoa(JSON.stringify({pageId: 'pagX', rowId: 'recY'}));
        expect(parseShelfView(`https://example.com/appX/pagZ?detail=${detail}`)).toBeNull();
        expect(parseShelfView(`https://airtable.com/whoami?detail=${detail}`)).toBeNull();
    });
});

describe('cameFromShelf', () => {
    it('is true on the fullscreen view whose referrer is its shelf', () => {
        expect(cameFromShelf(FULLSCREEN_URL, SHELF_URL)).toBe(true);
    });

    it('matches by origin+path, ignoring query params Airtable appends', () => {
        expect(cameFromShelf(`${FULLSCREEN_URL}?foo=bar`, SHELF_URL)).toBe(true);
    });

    it('is false on a different page than the referrer shelf points at', () => {
        expect(
            cameFromShelf('https://airtable.com/apptivTqaoebkrmV1/pagOther/recOther', SHELF_URL),
        ).toBe(false);
    });

    it('is false when the referrer is not a shelf view', () => {
        expect(cameFromShelf(FULLSCREEN_URL, FULLSCREEN_URL)).toBe(false);
        expect(cameFromShelf(FULLSCREEN_URL, 'https://airtable.com/apptivTqaoebkrmV1')).toBe(false);
    });

    it('is false with no referrer at all', () => {
        expect(cameFromShelf(FULLSCREEN_URL, '')).toBe(false);
    });
});
