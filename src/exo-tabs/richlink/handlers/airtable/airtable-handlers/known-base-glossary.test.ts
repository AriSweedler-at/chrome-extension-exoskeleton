import {describe, it, expect, afterEach} from 'vitest';
import {glossaryConfig} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/known-base-glossary';
import {createSubHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/handler-factory';

const glossaryHandler = createSubHandler(glossaryConfig);

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

    it('should extract rec ID from detail-panel URL', () => {
        addTextCell('SSP');

        const detail = globalThis.btoa(
            JSON.stringify({pageId: 'pagXYZ', rowId: 'recK1hqBktQeDGchN'}),
        );
        const formats = glossaryHandler.getFormats({
            url: `https://airtable.com/appebZJp08MytrQhs/pagListView?detail=${detail}`,
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

    it('should use first sentence directly when no prefix', () => {
        addTextCell('SLA');
        addDefinitionViaLabelCellPair('service-level agreement');

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recXYZ',
        });
        expect(formats[0].html).toContain('Airtable Glossary: SLA: service-level agreement');
    });

    it('should strip trailing parenthetical', () => {
        addTextCell('ATL');
        addDefinitionViaLabelCellPair('Above the line (Director, VPs, C-suite)');

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recXYZ',
        });
        expect(formats[0].html).toContain('Airtable Glossary: ATL: Above the line');
        expect(formats[0].html).not.toContain('Director');
    });

    it('should strip "is/are" prefix', () => {
        addTextCell('DNS');
        addDefinitionViaLabelCellPair('DNS is Domain Name System.');

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recXYZ',
        });
        expect(formats[0].html).toContain('Airtable Glossary: DNS: Domain Name System');
    });

    it('should strip subordinate clause and parenthetical', () => {
        addTextCell('FLA');
        addDefinitionViaLabelCellPair(
            'Flexible License Agreement (an Airtable-coined term), which means companies choose to have Enterprise permissions at the team/group level',
        );

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recK1hqBktQeDGchN',
        });
        expect(formats[0].html).toContain('Airtable Glossary: FLA: Flexible License Agreement');
        expect(formats[0].html).not.toContain('Airtable-coined');
    });

    it('should truncate at second sentence', () => {
        addTextCell('ACV');
        addDefinitionViaLabelCellPair('Annual Contract Value. See also ARR.');

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recXYZ',
        });
        expect(formats[0].html).toContain('Airtable Glossary: ACV: Annual Contract Value');
        expect(formats[0].html).not.toContain('See also');
    });

    it('should reject wordy expansions without a prefix', () => {
        addTextCell('command of the message');
        addDefinitionViaLabelCellPair(
            "Airtable's broader business-side organization, including Sales, Customer Success, Support, PS, and other teams.",
        );

        const formats = glossaryHandler.getFormats({
            url: 'https://airtable.com/appebZJp08MytrQhs/recXYZ',
        });
        expect(formats[0].html).toContain('Airtable Glossary: command of the message<');
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

    describe('definition expansion heuristics', () => {
        const URL = 'https://airtable.com/appebZJp08MytrQhs/recXYZ';

        interface ExpansionCase {
            name: string;
            definition: string;
            expected: string;
        }

        const expansionCases: ExpansionCase[] = [
            {
                name: 'SSP',
                definition: 'SSP stands for Single-Service Pipeline.',
                expected: 'SSP: Single-Service Pipeline',
            },
            {
                name: 'DNS',
                definition: 'DNS is Domain Name System.',
                expected: 'DNS: Domain Name System',
            },
            {
                name: 'SLA',
                definition: 'service-level agreement',
                expected: 'SLA: service-level agreement',
            },
            {
                name: 'ARR',
                definition: 'Annual recurring revenue.',
                expected: 'ARR: Annual recurring revenue',
            },
            {
                name: 'ACV',
                definition: 'Annual Contract Value. See also ARR.',
                expected: 'ACV: Annual Contract Value',
            },
            {
                name: 'ATL',
                definition: 'Above the line (Director, VPs, C-suite)',
                expected: 'ATL: Above the line',
            },
            {
                name: 'FLA',
                definition:
                    'Flexible License Agreement (an Airtable-coined term), which means companies choose',
                expected: 'FLA: Flexible License Agreement',
            },
        ];

        const rejectionCases: Omit<ExpansionCase, 'expected'>[] = [
            {
                name: 'command of the message',
                definition:
                    "Airtable's broader business-side organization, including Sales, Customer Success, Support, PS, and other teams.",
            },
        ];

        afterEach(() => {
            document.body.innerHTML = '';
        });

        it.each(expansionCases)('$name → "$expected"', ({name, definition, expected}) => {
            addTextCell(name);
            addDefinitionViaLabelCellPair(definition);
            const formats = glossaryHandler.getFormats({url: URL});
            expect(formats[0].html).toContain(`Airtable Glossary: ${expected}`);
        });

        it.each(rejectionCases)('$name — rejects wordy expansion', ({name, definition}) => {
            addTextCell(name);
            addDefinitionViaLabelCellPair(definition);
            const formats = glossaryHandler.getFormats({url: URL});
            expect(formats[0].html).toContain(`Airtable Glossary: ${name}<`);
        });
    });
});
