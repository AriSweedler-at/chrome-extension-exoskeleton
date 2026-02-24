import {Handler, type FormatContext} from '@exo/exo-tabs/richlink/base';

export class AirtableHandler extends Handler {
    readonly priority = 40;

    readonly label = 'Airtable Record';

    canHandle(url: string): boolean {
        return url.includes('airtable.com');
    }

    extractLinkText(_ctx: FormatContext): string {
        // Listable record: first cell-editor is a formula field with "LTT#/Title"
        const formulaCell = document.querySelector(
            '[data-testid="cell-editor"][data-columntype="formula"] .heading-size-default',
        );
        if (formulaCell?.textContent) {
            const raw = formulaCell.textContent.trim();
            // Convert "LTT69717/Title text" → "LTT69717: Title text"
            const slashIdx = raw.indexOf('/');
            if (slashIdx !== -1) {
                return `${raw.slice(0, slashIdx)}: ${raw.slice(slashIdx + 1)}`;
            }
            return raw;
        }

        // Base name
        const baseName = document.querySelector('.basename');
        if (baseName?.textContent) {
            return baseName.textContent.trim();
        }

        // Table name
        const tableName = document.querySelector('[data-tutorial-selector-id="tableHeaderName"]');
        if (tableName?.textContent) {
            return tableName.textContent.trim();
        }

        // View name
        const viewName = document.querySelector('.viewMenuButton');
        if (viewName?.textContent) {
            return viewName.textContent.trim();
        }

        return 'Airtable Record';
    }
}
