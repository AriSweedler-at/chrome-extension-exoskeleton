import {linkFormat} from '@exo/exo-tabs/richlink/base';
import type {
    AirtableBaseConfig,
    AirtableSubHandler,
} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {
    airtableBases,
    DEFAULT_MAX_TITLE_LEN,
} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/bases';

export {airtableBases, DEFAULT_MAX_TITLE_LEN};

/**
 * Canonicalize an Airtable URL to a clean record permalink.
 *
 * Handles three URL patterns:
 *  1. Detail panel: ?detail=base64JSON → extract pageId+rowId from JSON
 *  2. Interfaces:   ?someKey=recXXX    → extract recId from query param value
 *  3. Old-style:    /appXXX/.../recXXX → already canonical, return as-is
 *
 * Returns the original URL unchanged if no record ID can be extracted.
 */
export function defaultCanonicalizeUrl(url: string): string {
    const parsed = new URL(url);
    const appId = parsed.pathname.split('/')[1];
    if (!appId?.startsWith('app')) return url;

    // Pattern 1: ?detail=base64JSON with { pageId, rowId }
    const detail = parsed.searchParams.get('detail');
    if (detail) {
        try {
            const json = JSON.parse(globalThis.atob(detail));
            const {pageId, rowId} = json;
            if (pageId && rowId) {
                return `${parsed.origin}/${appId}/${pageId}/${rowId}`;
            }
        } catch {
            // fall through
        }
    }

    // Pattern 2: Interfaces URL with ?someKey=recXXX as a query param value
    for (const val of parsed.searchParams.values()) {
        if (/^rec[A-Za-z0-9]+$/.test(val)) {
            return `${parsed.origin}/${appId}/${val}`;
        }
    }

    return url;
}

/** Default title extractor: first formula cell's heading text. */
function defaultExtractTitle(_label: string): string | null {
    return (
        document
            .querySelector(
                '[data-testid="cell-editor"][data-columntype="formula"] .heading-size-default',
            )
            ?.textContent?.trim() || null
    );
}

/** Create an AirtableSubHandler from a declarative config. */
export function createSubHandler(config: AirtableBaseConfig): AirtableSubHandler {
    return {
        canHandle: (url) => url.href.includes(config.appId),
        getFormats({url}) {
            const canonicalize = config.canonicalizeUrl ?? defaultCanonicalizeUrl;
            const title = (config.extractTitle ?? defaultExtractTitle)(config.label);

            return [linkFormat(config.label, 35, title || config.label, canonicalize(url))];
        },
    };
}

export const registeredHandlers = airtableBases.map(createSubHandler);

export const customDomains = airtableBases
    .map((b) => b.domain)
    .filter((d): d is string => d != null);
