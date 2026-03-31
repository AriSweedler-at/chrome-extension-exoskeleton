import {describe, it, expect} from 'vitest';
import {canonicalAirtableUrl} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/registry';

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

    it('should canonicalize interfaces URL with rec in query param', () => {
        expect(
            canonicalAirtableUrl(
                'https://airtable.com/appebZJp08MytrQhs/pagagsZtQRDbx4O5u?ACh2y=recK1hqBktQeDGchN',
            ),
        ).toBe('https://airtable.com/appebZJp08MytrQhs/recK1hqBktQeDGchN');
    });

    it('should pass through URL unchanged when no detail param and no rec param', () => {
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
