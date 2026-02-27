import {describe, it, expect} from 'vitest';
import {canonicalAirtableUrl} from '@exo/exo-tabs/richlink/handlers/airtable/url-utils';

describe('canonicalAirtableUrl', () => {
    it('should canonicalize detail-view URL to record permalink', () => {
        const detail = globalThis.btoa(
            JSON.stringify({pageId: 'pagYS8GHSAS9swLLI', rowId: 'recrPE9CmgcEG008T'}),
        );
        const detailUrl = `https://airtable.com/appXYZ123/pagListPage?GI5YH=allRecords&detail=${detail}`;

        expect(canonicalAirtableUrl(detailUrl)).toBe(
            'https://airtable.com/appXYZ123/pagYS8GHSAS9swLLI/recrPE9CmgcEG008T',
        );
    });

    it('should pass through URL unchanged when no detail param', () => {
        const url = 'https://airtable.com/appXYZ123/pagABC/recDEF?home=pagGHI';
        expect(canonicalAirtableUrl(url)).toBe(url);
    });

    it('should pass through URL unchanged when detail param is malformed', () => {
        const url = 'https://airtable.com/appXYZ123/pagABC?detail=notvalidbase64!!!';
        expect(canonicalAirtableUrl(url)).toBe(url);
    });

    it('should pass through URL unchanged when detail JSON lacks pageId', () => {
        const detail = globalThis.btoa(JSON.stringify({rowId: 'recXYZ'}));
        const url = `https://airtable.com/appXYZ123/pagABC?detail=${detail}`;
        expect(canonicalAirtableUrl(url)).toBe(url);
    });
});
