import {describe, it, expect, afterEach} from 'vitest';
import {glossaryHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/glossary/glossary.handler';

function addTextCell(text: string) {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'cell-editor');
    el.setAttribute('data-columntype', 'text');
    el.textContent = text;
    document.body.appendChild(el);
}

/** Old-style data view: .labelCellPair with .fieldLabel "Definition" */
function addDefinitionViaLabelCellPair(text: string) {
    const pair = document.createElement('div');
    pair.className = 'labelCellPair';

    const label = document.createElement('div');
    label.className = 'fieldLabel';
    label.textContent = 'Definition';
    pair.appendChild(label);

    const cellEditor = document.createElement('div');
    cellEditor.setAttribute('data-testid', 'cell-editor');
    cellEditor.setAttribute('data-columntype', 'richText');
    cellEditor.textContent = text;
    pair.appendChild(cellEditor);

    document.body.appendChild(pair);
}

/** Interfaces view: <span>Definition</span> with a richText cell in a nearby ancestor */
function addDefinitionViaSpanLabel(text: string) {
    const container = document.createElement('div');

    const span = document.createElement('span');
    span.textContent = 'Definition';
    container.appendChild(span);

    const cellEditor = document.createElement('div');
    cellEditor.setAttribute('data-testid', 'cell-editor');
    cellEditor.setAttribute('data-columntype', 'richText');
    cellEditor.textContent = text;
    container.appendChild(cellEditor);

    document.body.appendChild(container);
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

    it('should include expansion from labelCellPair Definition field', () => {
        addTextCell('SSP');
        addDefinitionViaLabelCellPair(
            'SSP stands for Single-Service Pipeline. The SO team has different groupings.',
        );

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recK1hqBktQeDGchN',
        });
        expect(formats[0].html).toContain('Airtable Glossary: SSP: Single-Service Pipeline');
    });

    it('should include expansion from interfaces span-label Definition field', () => {
        addTextCell('SSP');
        addDefinitionViaSpanLabel(
            'SSP stands for Single-Service Pipeline. The SO team has different groupings.',
        );

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recK1hqBktQeDGchN',
        });
        expect(formats[0].html).toContain('Airtable Glossary: SSP: Single-Service Pipeline');
    });

    it('should ignore unrelated richText cells and only use Definition field', () => {
        addTextCell('SSP');
        // Unrelated richText cell (e.g. from list panel) — no "Definition" label
        const stray = document.createElement('div');
        stray.setAttribute('data-testid', 'cell-editor');
        stray.setAttribute('data-columntype', 'richText');
        stray.textContent = 'Container Runtime Interface';
        document.body.appendChild(stray);

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recK1hqBktQeDGchN',
        });
        // Should NOT pick up "Container Runtime Interface"
        expect(formats[0].html).toContain('Airtable Glossary: SSP<');
        expect(formats[0].html).not.toContain('Container Runtime');
    });

    it('should omit expansion when result would exceed 100 chars', () => {
        addTextCell('SSP');
        addDefinitionViaLabelCellPair(
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
        addDefinitionViaLabelCellPair(
            'Kinesis Client Library is a Java library for consuming Kinesis streams.',
        );

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
