import {Handler} from '@exo/exo-tabs/richlink/base';

export class AirtableHandler extends Handler {
    readonly label = 'Airtable Record';
    readonly priority = 40;

    canHandle(url: string): boolean {
        return url.includes('airtable.com');
    }

    extractTitle(): string {
        // Try to extract base name (main selector)
        // TODO: Verify this selector works across different Airtable views
        const baseName = document.querySelector('.basename');
        if (baseName?.textContent) {
            return baseName.textContent.trim();
        }

        // Try to extract table name
        const tableName = document.querySelector('[data-tutorial-selector-id="tableHeaderName"]');
        if (tableName?.textContent) {
            return tableName.textContent.trim();
        }

        // Try to extract view name
        const viewName = document.querySelector('.viewMenuButton');
        if (viewName?.textContent) {
            return viewName.textContent.trim();
        }

        return 'Airtable Record';
    }
}
