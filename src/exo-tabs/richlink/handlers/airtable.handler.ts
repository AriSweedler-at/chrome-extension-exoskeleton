import {
    Handler,
    linkFormat,
    type FormatContext,
    type LinkFormat,
} from '@exo/exo-tabs/richlink/base';
import {
    defaultCanonicalizeUrl,
    registeredHandlers,
    customDomains,
} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/handler-factory';
import {queryFirstText} from '@exo/lib/dom';

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
        return (
            queryFirstText([
                '.basename', // base name
                '[data-tutorial-selector-id="tableHeaderName"]', // table name
                '.viewMenuButton', // view name
            ]) ?? 'Airtable Record'
        );
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
                defaultCanonicalizeUrl(ctx.url),
            ),
        );

        return formats;
    }
}
