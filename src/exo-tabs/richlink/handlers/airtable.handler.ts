import {
    Handler,
    linkFormat,
    type FormatContext,
    type LinkFormat,
} from '@exo/exo-tabs/richlink/base';
import type {AirtableSubHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {canonicalAirtableUrl} from '@exo/exo-tabs/richlink/handlers/airtable/url-utils';

// Auto-discover all *.handler.ts files under airtable-handlers/.
// To add a new sub-handler, just create a new {name}/{name}.handler.ts file — no other changes needed.
const modules = import.meta.glob('./airtable/airtable-handlers/*/*.handler.ts', {
    eager: true,
}) as Record<string, Record<string, unknown>>;

function isSubHandler(v: unknown): v is AirtableSubHandler {
    return (
        typeof v === 'object' &&
        v !== null &&
        typeof (v as AirtableSubHandler).canHandle === 'function' &&
        typeof (v as AirtableSubHandler).getFormats === 'function'
    );
}

const subHandlers: AirtableSubHandler[] = Object.values(modules).flatMap((mod) =>
    Object.values(mod).filter(isSubHandler),
);

export class AirtableHandler extends Handler {
    readonly label = 'Airtable Record';
    readonly priority = 40;

    canHandle(url: URL): boolean {
        return url.hostname === 'airtable.com';
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
        for (const sub of subHandlers) {
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
