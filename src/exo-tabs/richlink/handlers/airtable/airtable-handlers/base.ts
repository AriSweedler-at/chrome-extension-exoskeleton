import type {FormatContext, LinkFormat} from '@exo/exo-tabs/richlink/base';

export const DEFAULT_MAX_TITLE_LEN = 120;

/** Record ID extracted from an Airtable URL. */
export interface AirtableRecordRef {
    recordId: string;
    /** Present only when extracted from a detail-panel base64 JSON payload. */
    pageId?: string;
}

/**
 * Extract a record ID (and optional pageId) from an Airtable URL.
 *
 * Checks three URL patterns in order:
 *  1. Path segment:    /appXXX/.../recXXX
 *  2. Detail panel:    ?detail=base64JSON -> { rowId, pageId? }
 *  3. Query param val: ?someKey=recXXX
 */
export function extractRecordId(url: URL): AirtableRecordRef | null {
    const pathMatch = url.pathname.match(/\/(rec[A-Za-z0-9]+)/);
    if (pathMatch) return {recordId: pathMatch[1]};

    const detail = url.searchParams.get('detail');
    if (detail) {
        try {
            const json = JSON.parse(globalThis.atob(detail));
            if (json.rowId) {
                return {
                    recordId: json.rowId,
                    ...(json.pageId && {pageId: json.pageId}),
                };
            }
        } catch {
            // malformed base64/JSON — fall through
        }
    }

    for (const val of url.searchParams.values()) {
        if (/^rec[A-Za-z0-9]+$/.test(val)) return {recordId: val};
    }
    return null;
}

/** Interface for Airtable sub-handlers (one per base). */
export interface AirtableSubHandler {
    /** Return true if this sub-handler can produce formats for the given URL. */
    canHandle(url: URL): boolean;

    /** Return formats for the given context. Called only if canHandle returns true. */
    getFormats(ctx: FormatContext): LinkFormat[];
}

/** Declarative config for an Airtable base. Fed to createSubHandler() in handler-factory. */
export interface AirtableBaseConfig {
    /** Format-picker button label (e.g. "Escalation", "Listable Record"). */
    label: string;
    /** Airtable base ID (e.g. "appWh5G6JXbHDKC2b"). */
    appId: string;
    /** Custom domain (e.g. "escalations.airtable.app"). */
    domain?: string;
    /** Extract display title from the page DOM. Receives the label. */
    extractTitle: (label: string) => string | null;
    /** Build the canonical URL. Receives the parsed URL and pre-extracted record ref. */
    canonicalizeUrl?: (url: URL, ref: AirtableRecordRef | null) => string;
}
