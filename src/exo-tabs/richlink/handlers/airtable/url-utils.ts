/**
 * When viewing a record via the detail panel (list page with ?detail=base64JSON),
 * the URL is ugly and long. Extract the record permalink from the detail param.
 *
 * Detail param decodes to: { pageId: "pagXXX", rowId: "recXXX", ... }
 * Canonical URL: https://airtable.com/{appId}/{pageId}/{rowId}
 *
 * Returns the original URL unchanged if there is no detail param or it cannot be parsed.
 */
export function canonicalAirtableUrl(url: string): string {
    const parsed = new URL(url);
    const detail = parsed.searchParams.get('detail');
    if (!detail) return url;

    try {
        const json = JSON.parse(globalThis.atob(detail));
        const {pageId, rowId} = json;
        if (!pageId || !rowId) return url;

        const appId = parsed.pathname.split('/')[1];
        if (!appId?.startsWith('app')) return url;

        return `${parsed.origin}/${appId}/${pageId}/${rowId}`;
    } catch {
        return url;
    }
}
