import {
    Handler,
    linkFormat,
    type FormatContext,
    type LinkFormat,
} from '@exo/exo-tabs/richlink/base';
import {canonicalAirtableUrl} from '@exo/exo-tabs/richlink/handlers/airtable/url-utils';
import {
    registeredHandlers,
    customDomains,
} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/registry';

export class AirtableHandler extends Handler {
    readonly label = 'Airtable Record';
    readonly priority = 40;

    canHandle(url: URL): boolean {
        return (
            url.hostname === 'airtable.com' ||
            url.hostname.endsWith('.airtable.app') ||
            customDomains.includes(url.hostname)
        );
    }

    extractLinkText(): string {
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

    /** Override: collects formats from sub-handlers + generic fallback. */
    override getFormats(ctx: FormatContext): LinkFormat[] {
        const formats: LinkFormat[] = [];

        // Collect formats from matching sub-handlers
        for (const sub of registeredHandlers) {
            if (sub.canHandle(new URL(ctx.url))) {
                formats.push(...sub.getFormats(ctx));
            }
        }

        // Always include generic Airtable fallback
        formats.push(
            linkFormat(
                this.label,
                this.priority,
                this.extractLinkText(),
                canonicalAirtableUrl(ctx.url),
            ),
        );

        return formats;
    }
}
