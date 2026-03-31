import type {FormatContext, LinkFormat} from '@exo/exo-tabs/richlink/base';

/** Interface for Airtable sub-handlers (one per base). */
export interface AirtableSubHandler {
    /** Return true if this sub-handler can produce formats for the given URL. */
    canHandle(url: URL): boolean;

    /** Return formats for the given context. Called only if canHandle returns true. */
    getFormats(ctx: FormatContext): LinkFormat[];
}

/** Declarative config for an Airtable base. Fed to createSubHandler() in the registry. */
export interface AirtableBaseConfig {
    /** Format-picker button label (e.g. "Escalation", "Listable Record"). */
    label: string;
    /** Airtable base ID (e.g. "appWh5G6JXbHDKC2b"). */
    appId: string;
    /** Custom domain (e.g. "escalations.airtable.app"). */
    domain?: string;
    /** Extract display title from the page DOM. Default: first formula cell heading. */
    extractTitle?: () => string | null;
    /** Transform the raw extracted title. Applied after extractTitle. */
    transformTitle?: (raw: string) => string;
    /** Build the canonical URL for the link. Default: defaultCanonicalizeUrl(). */
    canonicalizeUrl?: (url: string) => string;
    /** If true, display title is "label: title" with truncation. */
    usePrefix?: boolean;
    /** Max length for the total link text. Uses truncateWithEllipsis. */
    maxTitleLen?: number;
}
