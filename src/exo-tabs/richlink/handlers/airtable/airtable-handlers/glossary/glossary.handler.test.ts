import {describe, it, expect, afterEach} from 'vitest';
import {glossaryHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/glossary/glossary.handler';

function addTextCell(text: string) {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'cell-editor');
    el.setAttribute('data-columntype', 'text');
    el.textContent = text;
    document.body.appendChild(el);
}

function addRichTextCell(text: string) {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'cell-editor');
    el.setAttribute('data-columntype', 'richText');
    el.textContent = text;
    document.body.appendChild(el);
}

describe('glossaryHandler', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should handle Glossary URLs', () => {
        expect(
            glossaryHandler.canHandle(
                new URL(
                    'https://airtable.com/appebZJp08MytrQhs/tblZwrY3sfRYng3IH/viwO9fiYOTdoKPmvM/recK1hqBktQeDGchN',
                ),
            ),
        ).toBe(true);
    });

    it('should not handle non-Glossary Airtable URLs', () => {
        expect(glossaryHandler.canHandle(new URL('https://airtable.com/appOTHER/tblXYZ'))).toBe(
            false,
        );
    });

    it('should extract title from text cell and link to record', () => {
        addTextCell('SSP');

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/tblZwrY3sfRYng3IH/viwO9fiYOTdoKPmvM/recK1hqBktQeDGchN?blocks=hide',
        });
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('Airtable Glossary');
        expect(formats[0].priority).toBe(35);
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appebZJp08MytrQhs/recK1hqBktQeDGchN">Airtable Glossary: SSP</a>',
        );
    });

    it('should extract rec ID from interfaces query param', () => {
        addTextCell('SSP');

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/pagagsZtQRDbx4O5u?ACh2y=recK1hqBktQeDGchN',
        });
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appebZJp08MytrQhs/recK1hqBktQeDGchN">Airtable Glossary: SSP</a>',
        );
    });

    it('should include expansion when "stands for" and under 100 chars', () => {
        addTextCell('SSP');
        addRichTextCell(
            'SSP stands for Single-Service Pipeline. The SO team has different groupings.',
        );

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recK1hqBktQeDGchN',
        });
        expect(formats[0].html).toContain('Airtable Glossary: SSP: Single-Service Pipeline');
    });

    it('should omit expansion when result would exceed 100 chars', () => {
        addTextCell('SSP');
        addRichTextCell(
            'SSP stands for Some Extremely Long Expansion That Would Make The Label Way Too Long For Comfortable Reading In A Link.',
        );

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recK1hqBktQeDGchN',
        });
        expect(formats[0].html).toContain('Airtable Glossary: SSP<');
        expect(formats[0].html).not.toContain('Some Extremely');
    });

    it('should fall back to short label when definition does not match "stands for"', () => {
        addTextCell('KCL');
        addRichTextCell('Kinesis Client Library is a Java library for consuming Kinesis streams.');

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recXYZ',
        });
        expect(formats[0].html).toContain('Airtable Glossary: KCL<');
    });

    it('should fall back to "Glossary Record" when text cell not found', () => {
        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/tblXYZ/viwABC/recDEF',
        });
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appebZJp08MytrQhs/recDEF">Airtable Glossary: Glossary Record</a>',
        );
    });

    it('should use raw URL when no rec ID found', () => {
        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/pagagsZtQRDbx4O5u',
        });
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appebZJp08MytrQhs/pagagsZtQRDbx4O5u">Airtable Glossary: Glossary Record</a>',
        );
    });
});
