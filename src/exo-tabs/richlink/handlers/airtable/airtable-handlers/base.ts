import type {FormatContext, LinkFormat} from '@exo/exo-tabs/richlink/base';

/** Interface for Airtable sub-handlers (one per base). */
export interface AirtableSubHandler {
    /** Return true if this sub-handler can produce formats for the given URL. */
    canHandle(url: string): boolean;

    /** Return formats for the given context. Called only if canHandle returns true. */
    getFormats(ctx: FormatContext): LinkFormat[];
}
