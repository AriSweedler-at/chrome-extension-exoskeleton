import {linkFormat} from '@exo/exo-tabs/richlink/base';
import type {
    AirtableBaseConfig,
    AirtableRecordRef,
    AirtableSubHandler,
} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {extractRecordId} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {airtableBases} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/known-bases';

export {airtableBases};

/**
 * Default URL canonicalization for Airtable sub-handlers.
 *
 * Uses a pre-extracted record ref to build a clean permalink:
 *  - detail panel ref with pageId → origin/appId/pageId/recId
 *  - query-param ref (no pageId)  → origin/appId/recId
 *  - path-based (no pageId)       → return URL as-is (already canonical)
 */
function canonicalizeWithRef(url: URL, ref: AirtableRecordRef | null): string {
    const appId = url.pathname.split('/')[1];
    if (!appId?.startsWith('app') || !ref) return url.href;

    if (ref.pageId) {
        return `${url.origin}/${appId}/${ref.pageId}/${ref.recordId}`;
    }
    // If recordId is already in the path, URL is canonical — return as-is.
    if (url.pathname.includes(ref.recordId)) return url.href;
    // Otherwise it came from a query param — build origin/appId/recId.
    return `${url.origin}/${appId}/${ref.recordId}`;
}

/**
 * String-accepting wrapper for use by airtable.handler.ts fallback.
 * Parses the URL, extracts the record ref, and delegates to canonicalizeWithRef.
 */
export function defaultCanonicalizeUrl(url: string): string {
    const parsed = new URL(url);
    return canonicalizeWithRef(parsed, extractRecordId(parsed));
}

/** Apply defaults to a config, filling in any unset optional fields. */
function withDefaults(config: AirtableBaseConfig): Required<AirtableBaseConfig> {
    return {
        ...config,
        domain: config.domain ?? '',
        canonicalizeUrl: config.canonicalizeUrl ?? canonicalizeWithRef,
    };
}

/** Create an AirtableSubHandler from a declarative config. */
export function createSubHandler(raw: AirtableBaseConfig): AirtableSubHandler {
    const config = withDefaults(raw);
    return {
        canHandle: (url) => url.href.includes(config.appId),
        getFormats({url}) {
            const title = config.extractTitle(config.label);
            const parsed = new URL(url);
            const ref = extractRecordId(parsed);
            return [
                linkFormat(
                    config.label,
                    35,
                    title || config.label,
                    config.canonicalizeUrl(parsed, ref),
                ),
            ];
        },
    };
}

export const registeredHandlers = airtableBases.map(createSubHandler);

export const customDomains = airtableBases
    .map((b) => b.domain)
    .filter((d): d is string => d != null);
