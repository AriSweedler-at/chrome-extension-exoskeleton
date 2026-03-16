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
export function canonicalAirtableUrl(url: string): string {
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
