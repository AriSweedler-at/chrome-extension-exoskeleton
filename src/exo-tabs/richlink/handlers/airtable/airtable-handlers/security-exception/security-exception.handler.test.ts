import {describe, it, expect, afterEach} from 'vitest';
import {securityExceptionHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/security-exception/security-exception.handler';

const LONG_TITLE = 'Multiple vulnerabilities in agent-k8s version. Please upgrade.';
const TRUNCATED_TITLE = 'Multiple vulnerabilities in agent-k8s...';

describe('securityExceptionHandler', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should handle Security Exceptions URLs', () => {
        expect(
            securityExceptionHandler.canHandle(
                new URL(
                    'https://airtable.com/appjBm1uPTsu1yTVU/pagMLoWZbcZ0v47Aq/rechslfu3s9zIJa6L',
                ),
            ),
        ).toBe(true);
    });

    it('should not handle non-Security-Exceptions Airtable URLs', () => {
        expect(
            securityExceptionHandler.canHandle(new URL('https://airtable.com/appOTHER/tblXYZ')),
        ).toBe(false);
    });

    it('should extract and truncate title from first text cell-editor', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'text');
        cellEditor.textContent = LONG_TITLE;
        document.body.appendChild(cellEditor);

        const formats = securityExceptionHandler.getFormats({
            url: 'https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC',
        });
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('Security Exception');
        expect(formats[0].priority).toBe(35);
        expect(formats[0].html).toBe(
            `<a href="https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC">Security Exception: ${TRUNCATED_TITLE}</a>`,
        );
    });

    it('should not truncate short titles', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'text');
        cellEditor.textContent = 'Short title';
        document.body.appendChild(cellEditor);

        const formats = securityExceptionHandler.getFormats({
            url: 'https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC',
        });
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC">Security Exception: Short title</a>',
        );
    });

    it('should include re-review date when date cell-editor exists', () => {
        const textCell = document.createElement('div');
        textCell.setAttribute('data-testid', 'cell-editor');
        textCell.setAttribute('data-columntype', 'text');
        textCell.textContent = LONG_TITLE;
        document.body.appendChild(textCell);

        const dateCell = document.createElement('div');
        dateCell.setAttribute('data-testid', 'cell-editor');
        dateCell.setAttribute('data-columntype', 'date');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = '2/13/2027';
        dateCell.appendChild(heading);
        document.body.appendChild(dateCell);

        const formats = securityExceptionHandler.getFormats({
            url: 'https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC',
        });
        expect(formats[0].html).toBe(
            `<a href="https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC">Security Exception: ${TRUNCATED_TITLE} (re-review 2/13/2027)</a>`,
        );
        expect(formats[0].text).toBe(
            `Security Exception: ${TRUNCATED_TITLE} (re-review 2/13/2027) (https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC)`,
        );
    });

    it('should fall back to "Security Exception" when no text cell found', () => {
        const formats = securityExceptionHandler.getFormats({
            url: 'https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC',
        });
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC">Security Exception: unknown title</a>',
        );
    });

    it('should canonicalize detail-view URL', () => {
        const textCell = document.createElement('div');
        textCell.setAttribute('data-testid', 'cell-editor');
        textCell.setAttribute('data-columntype', 'text');
        textCell.textContent = 'Some risk name';
        document.body.appendChild(textCell);

        const detail = globalThis.btoa(
            JSON.stringify({pageId: 'pagJ6m8B8IQ5qqiOp', rowId: 'rechslfu3s9zIJa6L'}),
        );
        const detailUrl = `https://airtable.com/appjBm1uPTsu1yTVU/pagMLoWZbcZ0v47Aq?detail=${detail}`;

        const formats = securityExceptionHandler.getFormats({url: detailUrl});
        expect(formats[0].html).toContain(
            'https://airtable.com/appjBm1uPTsu1yTVU/pagJ6m8B8IQ5qqiOp/rechslfu3s9zIJa6L',
        );
    });
});
