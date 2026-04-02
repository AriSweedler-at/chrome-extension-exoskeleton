import {describe, it, expect, afterEach} from 'vitest';
import {
    airtableBases,
    createSubHandler,
    customDomains,
    defaultCanonicalizeUrl,
} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/handler-factory';
import {DEFAULT_MAX_TITLE_LEN} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/known-bases';
import type {AirtableSubHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';

function getHandler(label: string): AirtableSubHandler {
    const config = airtableBases.find((b) => b.label === label);
    if (!config) throw new Error(`No config for label: ${label}`);
    return createSubHandler(config);
}

describe('handler-factory', () => {
    it('should export custom domains from configs with domain field', () => {
        expect(customDomains).toContain('escalations.airtable.app');
    });

    it('should create a handler that matches by appId', () => {
        const handler = createSubHandler({
            label: 'Test',
            appId: 'appTEST123',
            extractTitle: () => null,
        });
        expect(handler.canHandle(new URL('https://airtable.com/appTEST123/tblXYZ'))).toBe(true);
        expect(handler.canHandle(new URL('https://airtable.com/appOTHER/tblXYZ'))).toBe(false);
    });

    it('should fall back to label when extractTitle returns null', () => {
        const handler = createSubHandler({
            label: 'My Base',
            appId: 'appTEST123',
            extractTitle: () => null,
        });
        const formats = handler.getFormats({url: 'https://airtable.com/appTEST123/pagXYZ/recABC'});
        expect(formats[0].html).toContain('>My Base<');
    });
});

describe('Escalation handler', () => {
    const handler = getHandler('Escalation');

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should handle escalations.airtable.app URLs', () => {
        expect(
            handler.canHandle(
                new URL('https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagV4H5IuPFrR5SIF'),
            ),
        ).toBe(true);
    });

    it('should handle airtable.com URLs with escalations appId', () => {
        expect(
            handler.canHandle(new URL('https://airtable.com/appWh5G6JXbHDKC2b/pagV4H5IuPFrR5SIF')),
        ).toBe(true);
    });

    it('should not handle other base URLs', () => {
        expect(handler.canHandle(new URL('https://airtable.com/appOTHER/tblXYZ'))).toBe(false);
    });

    it('should extract title from formula cell', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = 'Some escalation title | 3/27/26';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const formats = handler.getFormats({
            url: 'https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagXYZ/recABC',
        });
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('Escalation');
        expect(formats[0].priority).toBe(35);
        expect(formats[0].html).toBe(
            '<a href="https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagXYZ/recABC">Escalation: Some escalation title | 3/27/26</a>',
        );
    });

    it('should fall back to label when no formula cell found', () => {
        const formats = handler.getFormats({
            url: 'https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagXYZ/recABC',
        });
        expect(formats[0].html).toBe(
            '<a href="https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagXYZ/recABC">Escalation</a>',
        );
    });

    it('should truncate long titles to DEFAULT_MAX_TITLE_LEN', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent =
            'Service Orchestration: Report card finding: Found unconfirmed Spacelift stack domains-production for more than 24 hours | 3/29/26';
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const formats = handler.getFormats({
            url: 'https://airtable.com/appWh5G6JXbHDKC2b/pagXYZ/recABC',
        });
        const linkText = formats[0].html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText.length).toBe(DEFAULT_MAX_TITLE_LEN);
        expect(linkText).toMatch(/^Escalation: /);
        expect(linkText).toMatch(/\.\.\.$/);
    });

    it('should canonicalize detail-view URL', () => {
        const detail = globalThis.btoa(
            JSON.stringify({pageId: 'paguOM7Eb387ZUnRE', rowId: 'reciVFVtwJrgn5Cbh'}),
        );
        const detailUrl = `https://escalations.airtable.app/appWh5G6JXbHDKC2b/pagListPage?detail=${detail}`;

        const formats = handler.getFormats({url: detailUrl});
        expect(formats[0].html).toContain(
            'https://escalations.airtable.app/appWh5G6JXbHDKC2b/paguOM7Eb387ZUnRE/reciVFVtwJrgn5Cbh',
        );
    });
});

describe('Listable Record handler', () => {
    const handler = getHandler('Listable Record');

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should handle Listable URLs', () => {
        expect(
            handler.canHandle(
                new URL(
                    'https://airtable.com/apptivTqaoebkrmV1/pagYS8GHSAS9swLLI/recrPE9CmgcEG008T',
                ),
            ),
        ).toBe(true);
    });

    it('should not handle non-Listable Airtable URLs', () => {
        expect(handler.canHandle(new URL('https://airtable.com/appOTHER/tblXYZ'))).toBe(false);
    });

    it('should convert slash to colon in formula cell title', () => {
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
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('Listable Record');
        expect(formats[0].priority).toBe(35);
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/apptivTqaoebkrmV1/pagYS8GHSAS9swLLI/recABC">LTT69717: Validate the existence of new images</a>',
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

        const formats = handler.getFormats({
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

        const formats = handler.getFormats({url: detailUrl});
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/apptivTqaoebkrmV1/pagYS8GHSAS9swLLI/recrPE9CmgcEG008T">LTT69726: Some task title</a>',
        );
    });

    it('should fall back to label when formula cell not found', () => {
        const formats = handler.getFormats({
            url: 'https://airtable.com/apptivTqaoebkrmV1/pagXYZ/recABC',
        });
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/apptivTqaoebkrmV1/pagYS8GHSAS9swLLI/recABC">Listable Record</a>',
        );
    });

    it('should truncate long titles to DEFAULT_MAX_TITLE_LEN', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'formula');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent =
            "LTT72498/Flaky failures in alpha: ENOENT: no such file or directory, open '/var/h/deploy/airtable/h/config/github/access_token.txt'";
        cellEditor.appendChild(heading);
        document.body.appendChild(cellEditor);

        const formats = handler.getFormats({
            url: 'https://airtable.com/apptivTqaoebkrmV1/pagXYZ/recABC',
        });
        const linkText = formats[0].html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText.length).toBe(DEFAULT_MAX_TITLE_LEN);
        expect(linkText).toMatch(/^LTT72498: /);
        expect(linkText).toMatch(/\.\.\.$/);
    });
});

describe('Security Exception handler', () => {
    const handler = getHandler('Security Exception');

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should handle Security Exceptions URLs', () => {
        expect(
            handler.canHandle(
                new URL(
                    'https://airtable.com/appjBm1uPTsu1yTVU/pagMLoWZbcZ0v47Aq/rechslfu3s9zIJa6L',
                ),
            ),
        ).toBe(true);
    });

    it('should not handle non-Security-Exceptions Airtable URLs', () => {
        expect(handler.canHandle(new URL('https://airtable.com/appOTHER/tblXYZ'))).toBe(false);
    });

    it('should extract title with prefix from text cell-editor', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'text');
        cellEditor.textContent = 'Multiple vulnerabilities in agent-k8s version. Please upgrade.';
        document.body.appendChild(cellEditor);

        const formats = handler.getFormats({
            url: 'https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC',
        });
        expect(formats).toHaveLength(1);
        expect(formats[0].label).toBe('Security Exception');
        expect(formats[0].priority).toBe(35);
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC">Security Exception: Multiple vulnerabilities in agent-k8s version. Please upgrade.</a>',
        );
    });

    it('should include re-review date', () => {
        const textCell = document.createElement('div');
        textCell.setAttribute('data-testid', 'cell-editor');
        textCell.setAttribute('data-columntype', 'text');
        textCell.textContent = 'Short title';
        document.body.appendChild(textCell);

        const dateCell = document.createElement('div');
        dateCell.setAttribute('data-testid', 'cell-editor');
        dateCell.setAttribute('data-columntype', 'date');
        const heading = document.createElement('div');
        heading.className = 'heading-size-default';
        heading.textContent = '2/13/2027';
        dateCell.appendChild(heading);
        document.body.appendChild(dateCell);

        const formats = handler.getFormats({
            url: 'https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC',
        });
        expect(formats[0].html).toBe(
            '<a href="https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC">Security Exception: Short title (re-review 2/13/2027)</a>',
        );
    });

    it('should truncate long titles to DEFAULT_MAX_TITLE_LEN', () => {
        const cellEditor = document.createElement('div');
        cellEditor.setAttribute('data-testid', 'cell-editor');
        cellEditor.setAttribute('data-columntype', 'text');
        cellEditor.textContent =
            'A very long security exception title that goes on and on about multiple critical vulnerabilities found in production systems across all regions';
        document.body.appendChild(cellEditor);

        const formats = handler.getFormats({
            url: 'https://airtable.com/appjBm1uPTsu1yTVU/pagXYZ/recABC',
        });
        const linkText = formats[0].html.match(/>([^<]+)<\/a>/)?.[1] ?? '';
        expect(linkText.length).toBe(DEFAULT_MAX_TITLE_LEN);
        expect(linkText).toMatch(/^Security Exception: /);
        expect(linkText).toMatch(/\.\.\.$/);
    });

    it('should fall back to "unknown title" when no text cell found', () => {
        const formats = handler.getFormats({
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

        const formats = handler.getFormats({url: detailUrl});
        expect(formats[0].html).toContain(
            'https://airtable.com/appjBm1uPTsu1yTVU/pagJ6m8B8IQ5qqiOp/rechslfu3s9zIJa6L',
        );
    });
});

describe('defaultCanonicalizeUrl', () => {
    it('should canonicalize detail-view URL to record permalink', () => {
        const detail = globalThis.btoa(
            JSON.stringify({pageId: 'pagYS8GHSAS9swLLI', rowId: 'recrPE9CmgcEG008T'}),
        );
        const detailUrl = `https://airtable.com/appXYZ123/pagListPage?GI5YH=allRecords&detail=${detail}`;

        expect(defaultCanonicalizeUrl(detailUrl)).toBe(
            'https://airtable.com/appXYZ123/pagYS8GHSAS9swLLI/recrPE9CmgcEG008T',
        );
    });

    it('should canonicalize interfaces URL with rec in query param', () => {
        expect(
            defaultCanonicalizeUrl(
                'https://airtable.com/appebZJp08MytrQhs/pagagsZtQRDbx4O5u?ACh2y=recK1hqBktQeDGchN',
            ),
        ).toBe('https://airtable.com/appebZJp08MytrQhs/recK1hqBktQeDGchN');
    });

    it('should pass through URL unchanged when no detail param and no rec param', () => {
        const url = 'https://airtable.com/appXYZ123/pagABC/recDEF?home=pagGHI';
        expect(defaultCanonicalizeUrl(url)).toBe(url);
    });

    it('should pass through URL unchanged when detail param is malformed', () => {
        const url = 'https://airtable.com/appXYZ123/pagABC?detail=notvalidbase64!!!';
        expect(defaultCanonicalizeUrl(url)).toBe(url);
    });

    it('should pass through URL unchanged when detail JSON lacks pageId', () => {
        const detail = globalThis.btoa(JSON.stringify({rowId: 'recXYZ'}));
        const url = `https://airtable.com/appXYZ123/pagABC?detail=${detail}`;
        expect(defaultCanonicalizeUrl(url)).toBe(url);
    });
});
