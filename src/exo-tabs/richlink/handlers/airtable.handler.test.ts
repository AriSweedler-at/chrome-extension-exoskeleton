import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
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
        expect(handler.canHandle('https://airtable.com/appABC123/tblXYZ789/viwDEF456')).toBe(true);
        expect(handler.canHandle('https://airtable.com/shrABC123')).toBe(true);
        expect(handler.canHandle('https://example.com')).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback).toBe(false);
    });

    it('should have priority 40', () => {
        expect(handler.priority).toBe(40);
    });

    it('should return "Airtable Record" as label', () => {
        expect(handler.label).toBe('Airtable Record');
    });

    it('should extract Listable record title from formula cell', () => {
        // Mock Listable DOM: cell-editor formula field with "LTT#/Title"
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = 'LTT69717/Validate the existence of new images';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        vi.stubGlobal('window', {
            location: {href: 'https://airtable.com/appABC123/tblXYZ789'},
        });

        const format = handler.getFormat({url: 'https://airtable.com/appABC123/tblXYZ789'});
        expect(format.html).toBe(
            '<a href="https://airtable.com/appABC123/tblXYZ789">LTT69717: Validate the existence of new images</a>',
        );
        expect(format.text).toBe(
            'LTT69717: Validate the existence of new images (https://airtable.com/appABC123/tblXYZ789)',
        );
    });

    it('should extract base name from Airtable page', () => {
        const mockBaseName = document.createElement('h1');
        mockBaseName.className = 'basename';
        mockBaseName.textContent = 'Product Roadmap';
        document.body.appendChild(mockBaseName);

        vi.stubGlobal('window', {
            location: {href: 'https://airtable.com/appABC123/tblXYZ789'},
        });

        const format = handler.getFormat({url: 'https://airtable.com/appABC123/tblXYZ789'});
        expect(format.html).toBe(
            '<a href="https://airtable.com/appABC123/tblXYZ789">Product Roadmap</a>',
        );
    });

    it('should fall back to "Airtable Record" when no selectors match', () => {
        vi.stubGlobal('window', {
            location: {href: 'https://airtable.com/appABC123/tblXYZ789'},
        });

        const format = handler.getFormat({url: 'https://airtable.com/appABC123/tblXYZ789'});
        expect(format.html).toBe(
            '<a href="https://airtable.com/appABC123/tblXYZ789">Airtable Record</a>',
        );
    });

    it('should extract table name if base name not found', () => {
        const mockTableName = document.createElement('div');
        mockTableName.setAttribute('data-tutorial-selector-id', 'tableHeaderName');
        mockTableName.textContent = 'Features';
        document.body.appendChild(mockTableName);

        vi.stubGlobal('window', {
            location: {href: 'https://airtable.com/appABC123/tblXYZ789'},
        });

        const format = handler.getFormat({url: 'https://airtable.com/appABC123/tblXYZ789'});
        expect(format.html).toBe('<a href="https://airtable.com/appABC123/tblXYZ789">Features</a>');
    });

    it('should handle view title selector', () => {
        const mockViewTitle = document.createElement('h2');
        mockViewTitle.className = 'viewMenuButton';
        mockViewTitle.textContent = 'Q1 2026 View';
        document.body.appendChild(mockViewTitle);

        vi.stubGlobal('window', {
            location: {href: 'https://airtable.com/appABC123/tblXYZ789/viwDEF456'},
        });

        const format = handler.getFormat({
            url: 'https://airtable.com/appABC123/tblXYZ789/viwDEF456',
        });
        expect(format.html).toBe(
            '<a href="https://airtable.com/appABC123/tblXYZ789/viwDEF456">Q1 2026 View</a>',
        );
    });

    it('should canonicalize detail-view URL to record permalink', () => {
        // Detail param encodes: { pageId: "pagYS8GHSAS9swLLI", rowId: "recrPE9CmgcEG008T", ... }
        const detail = globalThis.btoa(
            JSON.stringify({pageId: 'pagYS8GHSAS9swLLI', rowId: 'recrPE9CmgcEG008T'}),
        );
        const detailUrl = `https://airtable.com/appXYZ123/pagListPage?GI5YH=allRecords&detail=${detail}`;

        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = 'LTT69726/Some task title';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const format = handler.getFormat({url: detailUrl});
        expect(format.html).toBe(
            '<a href="https://airtable.com/appXYZ123/pagYS8GHSAS9swLLI/recrPE9CmgcEG008T">LTT69726: Some task title</a>',
        );
        expect(format.text).toBe(
            'LTT69726: Some task title (https://airtable.com/appXYZ123/pagYS8GHSAS9swLLI/recrPE9CmgcEG008T)',
        );
    });

    it('should pass through URL unchanged when no detail param', () => {
        const url = 'https://airtable.com/appXYZ123/pagABC/recDEF?home=pagGHI';

        const format = handler.getFormat({url});
        expect(format.html).toBe(`<a href="${url}">Airtable Record</a>`);
    });

    it('should pass through URL unchanged when detail param is malformed', () => {
        const url = 'https://airtable.com/appXYZ123/pagABC?detail=notvalidbase64!!!';

        const format = handler.getFormat({url});
        expect(format.html).toBe(`<a href="${url}">Airtable Record</a>`);
    });
});
