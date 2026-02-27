import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

export class AirtableHandler extends Handler {
    readonly priority = 40;

    readonly label = 'Airtable Record';

    canHandle(url: string): boolean {
        return url.includes('airtable.com');
    }

    /**
     * When viewing a record via the detail panel (list page with ?detail=base64JSON),
     * the URL is ugly and long. Extract the record permalink from the detail param.
     *
     * Detail param decodes to: { pageId: "pagXXX", rowId: "recXXX", ... }
     * Canonical URL: https://airtable.com/{appId}/{pageId}/{rowId}
     */
    private canonicalUrl(url: string): string {
        const parsed = new URL(url);
        const detail = parsed.searchParams.get('detail');
        if (!detail) return url;

        try {
            const json = JSON.parse(globalThis.atob(detail));
            const {pageId, rowId} = json;
            if (!pageId || !rowId) return url;

            // Extract appId from the pathname: /apptivTqaoebkrmV1/pagXXX...
            const appId = parsed.pathname.split('/')[1];
            if (!appId?.startsWith('app')) return url;

            return `${parsed.origin}/${appId}/${pageId}/${rowId}`;
        } catch {
            return url;
        }
    }

    getFormat(ctx: FormatContext): LinkFormat {
        const title = this.extractLinkText(ctx);
        const url = this.canonicalUrl(ctx.url);
        return {
            label: this.label,
            html: `<a href="${url}">${title}</a>`,
            text: `${title} (${url})`,
        };
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
