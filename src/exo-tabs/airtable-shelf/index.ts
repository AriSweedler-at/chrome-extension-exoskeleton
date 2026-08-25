/**
 * Airtable shelf isolation: jump from a record's shelf (sidesheet) view to
 * its fullscreen view and back — pure URL navigation, no state, no UI.
 *
 * A shelf URL is an interface page with a `detail` param (base64 JSON naming
 * the record's own pageId + rowId); the fullscreen view of the same record
 * is origin/appId/pageId/rowId. The return trip is history.back(), allowed
 * only when the referrer is the shelf URL this fullscreen view came from.
 */

import {safeUrl} from '@exo/lib/url';
import {extractRecordId} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';

export function isAirtableHost(url: string): boolean {
    const hostname = safeUrl(url)?.hostname;
    return hostname === 'airtable.com' || (hostname?.endsWith('.airtable.app') ?? false);
}

export interface ShelfView {
    /** The record's fullscreen view. */
    fullscreenUrl: string;
}

/**
 * Parse a shelf (sidesheet) view URL. Null unless the URL is an Airtable
 * page whose `detail` payload names the record's own page and row.
 */
export function parseShelfView(url: string): ShelfView | null {
    const urlObj = safeUrl(url);
    if (!urlObj || !isAirtableHost(url)) return null;

    const appId = urlObj.pathname.split('/').filter(Boolean)[0];
    if (!appId?.startsWith('app')) return null;

    // A pageId is only ever present when the ref came from a detail payload —
    // i.e. the record is open as a shelf, not already fullscreen.
    const ref = extractRecordId(urlObj);
    if (!ref?.pageId) return null;

    return {fullscreenUrl: `${urlObj.origin}/${appId}/${ref.pageId}/${ref.recordId}`};
}

/**
 * Is `currentUrl` the fullscreen view reached FROM the shelf view
 * `referrerUrl`? True exactly when the referrer is a shelf whose derived
 * fullscreen URL is this page (matched by origin+path — Airtable may append
 * query params). This is what makes history.back() safe: the previous
 * history entry is the shelf.
 */
export function cameFromShelf(currentUrl: string, referrerUrl: string): boolean {
    const shelf = parseShelfView(referrerUrl);
    if (!shelf) return false;
    const current = safeUrl(currentUrl);
    const target = safeUrl(shelf.fullscreenUrl);
    if (!current || !target) return false;
    return current.origin === target.origin && current.pathname === target.pathname;
}
