import {Handler} from '@exo/library/richlink/base';

export class AirtableHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('airtable.com');
    }

    getLabel(): string {
        return 'Airtable Record';
    }

    async getHtml(): Promise<string> {
        const title = this.extractTitle();
        const url = window.location.href;
        return `<a href="${url}">${title}</a>`;
    }

    async getText(): Promise<string> {
        const title = this.extractTitle();
        const url = window.location.href;
        return `${title} (${url})`;
    }

    getPriority(): number {
        return 40;
    }

    private extractTitle(): string {
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
