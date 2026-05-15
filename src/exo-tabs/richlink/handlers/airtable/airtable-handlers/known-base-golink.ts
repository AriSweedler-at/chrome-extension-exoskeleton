import type {AirtableBaseConfig} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';

const GOLINK_APP_ID = 'appVDgfLKNQo9z5b2';

/**
 * The go-link slug lives in the page-header text cell (the record name shown
 * as a large heading), not the first text cell on the page (which holds the
 * destination URL field).
 */
function readGolinkSlug(): string | null {
    const cell = document.querySelector(
        '#pageCellLabelPair [data-testid="cell-editor"][data-columntype="text"]',
    );
    return cell?.textContent?.trim() || null;
}

export const golinkConfig: AirtableBaseConfig = {
    label: 'Golink',
    appId: GOLINK_APP_ID,
    extractTitle: () => {
        const slug = readGolinkSlug();
        return slug ? `go/${slug}` : null;
    },
    canonicalizeUrl: (url) => {
        const slug = readGolinkSlug();
        return slug ? `https://go/${slug}` : url.href;
    },
};
