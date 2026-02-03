import {describe, it, expect, beforeEach, vi} from 'vitest';
import {AirtableHandler} from '../../../../src/library/richlink/handlers/airtable.handler';

describe('AirtableHandler', () => {
    let handler: AirtableHandler;

    beforeEach(() => {
        handler = new AirtableHandler();
    });

    it('should handle Airtable URLs', () => {
        expect(handler.canHandle('https://airtable.com/appABC123/tblXYZ789/viwDEF456')).toBe(true);
        expect(handler.canHandle('https://airtable.com/shrABC123')).toBe(true);
        expect(handler.canHandle('https://example.com')).toBe(false);
    });

    it('should not be a fallback handler', () => {
        expect(handler.isFallback()).toBe(false);
    });

    it('should have priority 40', () => {
        expect(handler.getPriority()).toBe(40);
    });

    it('should return "Airtable Record" as label', () => {
        expect(handler.getLabel()).toBe('Airtable Record');
    });

    it('should extract base name from Airtable page', async () => {
        // Mock Airtable page DOM with base name
        const mockBaseName = document.createElement('h1');
        mockBaseName.className = 'basename';
        mockBaseName.textContent = 'Product Roadmap';
        document.body.appendChild(mockBaseName);

        vi.stubGlobal('window', {
            location: {
                href: 'https://airtable.com/appABC123/tblXYZ789',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://airtable.com/appABC123/tblXYZ789">Product Roadmap</a>');

        const text = await handler.getText();
        expect(text).toBe('Product Roadmap (https://airtable.com/appABC123/tblXYZ789)');

        document.body.removeChild(mockBaseName);
    });

    it('should handle missing base name', async () => {
        vi.stubGlobal('window', {
            location: {
                href: 'https://airtable.com/appABC123/tblXYZ789',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://airtable.com/appABC123/tblXYZ789">Airtable Record</a>');
    });

    it('should extract table name if base name not found', async () => {
        // Mock Airtable page with table name selector
        const mockTableName = document.createElement('div');
        mockTableName.setAttribute('data-tutorial-selector-id', 'tableHeaderName');
        mockTableName.textContent = 'Features';
        document.body.appendChild(mockTableName);

        vi.stubGlobal('window', {
            location: {
                href: 'https://airtable.com/appABC123/tblXYZ789',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://airtable.com/appABC123/tblXYZ789">Features</a>');

        document.body.removeChild(mockTableName);
    });

    it('should handle view title selector', async () => {
        const mockViewTitle = document.createElement('h2');
        mockViewTitle.className = 'viewMenuButton';
        mockViewTitle.textContent = 'Q1 2026 View';
        document.body.appendChild(mockViewTitle);

        vi.stubGlobal('window', {
            location: {
                href: 'https://airtable.com/appABC123/tblXYZ789/viwDEF456',
            },
        });

        const html = await handler.getHtml();
        expect(html).toBe('<a href="https://airtable.com/appABC123/tblXYZ789/viwDEF456">Q1 2026 View</a>');

        document.body.removeChild(mockViewTitle);
    });
});
