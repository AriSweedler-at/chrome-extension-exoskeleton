import {describe, it, expect, afterEach} from 'vitest';
import {listableHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/listable/listable.handler';

describe('listableHandler', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should handle Listable URLs', () => {
        expect(
            listableHandler.canHandle(
                'https://airtable.com/apptivTqaoebkrmV1/pagYS8GHSAS9swLLI/recrPE9CmgcEG008T',
            ),
        ).toBe(true);
    });

    it('should not handle non-Listable Airtable URLs', () => {
        expect(listableHandler.canHandle('https://airtable.com/appOTHER/tblXYZ')).toBe(false);
    });

    it('should extract Listable record title from formula cell', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = 'LTT69717/Validate the existence of new images';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const formats = listableHandler.getFormats({
            url: 'https://airtable.com/apptivTqaoebkrmV1/pagXYZ/recABC',
        });
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('Listable Record');
        expect(formats[0].priority).toBe(35);
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/apptivTqaoebkrmV1/pagXYZ/recABC">LTT69717: Validate the existence of new images</a>',
        );
    });

    it('should handle formula cell text without slash separator', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = 'STANDALONE-TITLE';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const formats = listableHandler.getFormats({
            url: 'https://airtable.com/apptivTqaoebkrmV1/pagXYZ/recABC',
        });
        expect(formats[0].html).toContain('STANDALONE-TITLE');
    });

    it('should canonicalize detail-view URL', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = 'LTT69726/Some task title';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const detail = globalThis.btoa(
            JSON.stringify({pageId: 'pagYS8GHSAS9swLLI', rowId: 'recrPE9CmgcEG008T'}),
        );
        const detailUrl = `https://airtable.com/apptivTqaoebkrmV1/pagListPage?detail=${detail}`;

        const formats = listableHandler.getFormats({url: detailUrl});
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/apptivTqaoebkrmV1/pagYS8GHSAS9swLLI/recrPE9CmgcEG008T">LTT69726: Some task title</a>',
        );
    });

    it('should fall back to "Listable Record" when formula cell not found', () => {
        const formats = listableHandler.getFormats({
            url: 'https://airtable.com/apptivTqaoebkrmV1/pagXYZ/recABC',
        });
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/apptivTqaoebkrmV1/pagXYZ/recABC">Listable Record</a>',
        );
    });
});
