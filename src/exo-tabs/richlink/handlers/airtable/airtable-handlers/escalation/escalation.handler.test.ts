import {describe, it, expect, afterEach} from 'vitest';
import {escalationHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/escalation/escalation.handler';

describe('escalationHandler', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should handle Escalations base URLs', () => {
        expect(
            escalationHandler.canHandle(
                new URL('https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagV4H5IuPFrR5SIF'),
            ),
        ).toBe(true);
        expect(
            escalationHandler.canHandle(
                new URL('https://airtable.com/appWh5G6JXbHDKC2b/pagV4H5IuPFrR5SIF'),
            ),
        ).toBe(true);
    });

    it('should not handle other base URLs', () => {
        expect(escalationHandler.canHandle(new URL('https://airtable.com/appOTHER/tblXYZ'))).toBe(
            false,
        );
    });

    it('should extract title from formula cell', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent =
            'Update DNS record - Include AirProcure link if related to a vendor: airtable-labs.com DNS | 3/27/26';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const formats = escalationHandler.getFormats({
            url: 'https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagXYZ/recABC',
        });
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('Escalation');
        expect(formats[0].priority).toBe(35);
        expect(formats[0].html).toBe(
            '<a href="https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagXYZ/recABC">Update DNS record - Include AirProcure link if related to a vendor: airtable-labs.com DNS | 3/27/26</a>',
        );
    });

    it('should fall back to "Escalation" when no formula cell found', () => {
        const formats = escalationHandler.getFormats({
            url: 'https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagXYZ/recABC',
        });
        expect(formats[0].html).toBe(
            '<a href="https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagXYZ/recABC">Escalation</a>',
        );
    });

    it('should canonicalize detail-view URL', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = 'Some escalation title';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const detail = globalThis.btoa(
            JSON.stringify({pageId: 'paguOM7Eb387ZUnRE', rowId: 'reciVFVtwJrgn5Cbh'}),
        );
        const detailUrl = `https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagListPage?detail=${detail}`;

        const formats = escalationHandler.getFormats({url: detailUrl});
        expect(formats[0].html).toContain(
            'https://escalations.airtable.app/appWh5G6JXbHDKC2b/paguOM7Eb387ZUnRE/reciVFVtwJrgn5Cbh',
        );
    });
});
