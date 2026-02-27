import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';
import type {AirtableSubHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {listableHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/listable/listable.handler';
import {canonicalAirtableUrl} from '@exo/exo-tabs/richlink/handlers/airtable/url-utils';

/** Sub-handlers tried in order; each matching handler contributes formats. */
const subHandlers: AirtableSubHandler[] = [listableHandler];

export class AirtableHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('airtable.com');
    }

    getFormats(ctx: FormatContext): LinkFormat[] {
        const formats: LinkFormat[] = [];

        // Collect formats from matching sub-handlers
        for (const sub of subHandlers) {
            if (sub.canHandle(ctx.url)) {
                formats.push(...sub.getFormats(ctx));
            }
        }

        // Always include generic Airtable fallback
        const url = canonicalAirtableUrl(ctx.url);
        const title = this.extractGenericTitle();
        formats.push({
            label: 'Airtable Record',
            priority: 40,
            html: `<a href="${url}">${title}</a>`,
            text: `${title} (${url})`,
        });

        return formats;
    }

    private extractGenericTitle(): string {
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
