import {describe, it, expect, afterEach} from 'vitest';
import {gridguardConfig} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/known-base-gridguard';
import {createSubHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/handler-factory';

const gridguardHandler = createSubHandler(gridguardConfig);

const RECORD_URL = 'https://airtable.com/app8A8BeDXriEmo9o/pag0qy1fJY3YlXVwb/recEHkd7S4nKz6iHM';

function addFormulaCell(text: string) {
    const cell = document.createElement('div');
    cell.setAttribute('data-testid', 'cell-editor');
    cell.setAttribute('data-columntype', 'formula');
    cell.textContent = text;
    document.body.appendChild(cell);
}

describe('gridguardHandler', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('handles GridGuard base URLs', () => {
        expect(gridguardHandler.canHandle(new URL(RECORD_URL))).toBe(true);
    });

    it('does not handle other Airtable base URLs', () => {
        expect(gridguardHandler.canHandle(new URL('https://airtable.com/appOTHER/recXYZ'))).toBe(
            false,
        );
    });

    it('produces "GridGuard vuln: <container> (<record-id>)"', () => {
        addFormulaCell('rad.dkr.4530');
        addFormulaCell('Container aws-cli: 2 medium, 16 low vulnerabilities (29 total)');
        addFormulaCell('2026-04-14');

        const formats = gridguardHandler.getFormats({url: RECORD_URL});
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('GridGuard vuln');
        expect(formats[0].text).toContain('GridGuard vuln: aws-cli (rad.dkr.4530)');
    });

    it('falls back to just the record id when no container cell is present', () => {
        addFormulaCell('rad.dkr.4530');
        addFormulaCell('2026-04-14');

        const formats = gridguardHandler.getFormats({url: RECORD_URL});
        expect(formats[0].text).toContain('GridGuard vuln: rad.dkr.4530');
    });

    it('falls back to label only when the first formula cell is empty', () => {
        const formats = gridguardHandler.getFormats({url: RECORD_URL});
        expect(formats[0].text).toContain('GridGuard vuln (');
    });
});
