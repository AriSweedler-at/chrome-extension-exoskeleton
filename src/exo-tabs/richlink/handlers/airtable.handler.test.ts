import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {AirtableHandler} from '@exo/exo-tabs/richlink/handlers/airtable.handler';

describe('AirtableHandler', () => {
    let handler: AirtableHandler;

    beforeEach(() => {
        handler = new AirtableHandler();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should handle Airtable URLs', () => {
        expect(
            handler.canHandle(new URL('https://airtable.com/appABC123/tblXYZ789/viwDEF456')),
        ).toBe(true);
        expect(handler.canHandle(new URL('https://airtable.com/shrABC123'))).toBe(true);
        expect(
            handler.canHandle(
                new URL('https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagV4H5IuPFrR5SIF'),
            ),
        ).toBe(true);
        expect(handler.canHandle(new URL('https://example.com'))).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback).toBe(false);
    });

    // --- Generic Airtable format (non-Listable URLs) ---

    it('should return single format for non-Listable URLs', () => {
        const formats = handler.getFormats({url: 'https://airtable.com/appOTHER/tblXYZ'});
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('Airtable Record');
        expect(formats[0].priority).toBe(40);
    });

    it('should extract base name from Airtable page', () => {
        const mockBaseName = document.createElement('h1');
        mockBaseName.className = 'basename';
        mockBaseName.textContent = 'Product Roadmap';
        document.body.appendChild(mockBaseName);

        const formats = handler.getFormats({url: 'https://airtable.com/appOTHER/tblXYZ'});
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appOTHER/tblXYZ">Product Roadmap</a>',
        );
    });

    it('should extract table name if base name not found', () => {
        const mockTableName = document.createElement('div');
        mockTableName.setAttribute('data-tutorial-selector-id', 'tableHeaderName');
        mockTableName.textContent = 'Features';
        document.body.appendChild(mockTableName);

        const formats = handler.getFormats({url: 'https://airtable.com/appOTHER/tblXYZ'});
        expect(formats[0].html).toBe('<a href="https://airtable.com/appOTHER/tblXYZ">Features</a>');
    });

    it('should handle view title selector', () => {
        const mockViewTitle = document.createElement('h2');
        mockViewTitle.className = 'viewMenuButton';
        mockViewTitle.textContent = 'Q1 2026 View';
        document.body.appendChild(mockViewTitle);

        const formats = handler.getFormats({
            url: 'https://airtable.com/appOTHER/tblXYZ/viwDEF456',
        });
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appOTHER/tblXYZ/viwDEF456">Q1 2026 View</a>',
        );
    });

    it('should fall back to "Airtable Record" when no selectors match', () => {
        const formats = handler.getFormats({url: 'https://airtable.com/appOTHER/tblXYZ'});
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appOTHER/tblXYZ">Airtable Record</a>',
        );
    });

    // --- Listable dispatch ---

    it('should return Listable + Airtable formats for Listable URLs', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = 'LTT69717/Validate the existence of new images';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const formats = handler.getFormats({
            url: 'https://airtable.com/apptivTqaoebkrmV1/pagXYZ/recABC',
        });
        expect(formats).toHaveLength(2);

        // Listable format first (priority 35)
        expect(formats[0].label).toBe('Listable Record');
        expect(formats[0].priority).toBe(35);
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/apptivTqaoebkrmV1/pagXYZ/recABC">LTT69717: Validate the existence of new images</a>',
        );

        // Generic Airtable format second (priority 40)
        expect(formats[1].label).toBe('Airtable Record');
        expect(formats[1].priority).toBe(40);
    });

    it('should canonicalize detail-view URL in both Listable and generic formats', () => {
        const detail = globalThis.btoa(
            JSON.stringify({pageId: 'pagYS8GHSAS9swLLI', rowId: 'recrPE9CmgcEG008T'}),
        );
        const detailUrl = `https://airtable.com/apptivTqaoebkrmV1/pagListPage?detail=${detail}`;

        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = 'LTT69726/Some task title';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const formats = handler.getFormats({url: detailUrl});
        const canonical =
            'https://airtable.com/apptivTqaoebkrmV1/pagYS8GHSAS9swLLI/recrPE9CmgcEG008T';

        // Both formats should use the canonical URL
        expect(formats[0].html).toContain(canonical);
        expect(formats[1].html).toContain(canonical);
    });

    it('should not crash on Listable URL with malformed detail param', () => {
        const url = 'https://airtable.com/apptivTqaoebkrmV1/pagABC?detail=!!!bad!!!';
        const formats = handler.getFormats({url});
        // Should still return 2 formats (listable + generic), both using original URL
        expect(formats).toHaveLength(2);
        expect(formats[0].html).toContain(url);
        expect(formats[1].html).toContain(url);
    });
});
