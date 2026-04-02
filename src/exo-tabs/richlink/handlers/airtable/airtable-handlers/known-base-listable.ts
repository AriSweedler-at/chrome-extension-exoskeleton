import type {AirtableBaseConfig} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {truncateWithEllipsis} from '@exo/exo-tabs/richlink/base';
import {DEFAULT_MAX_TITLE_LEN} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/known-bases';

const LISTABLE_APP_ID = 'apptivTqaoebkrmV1';
/** The "fullscreen record" page — works as a stable permalink for any record. */
const FULLSCREEN_PAGE_ID = 'pagYS8GHSAS9swLLI';

/**
 * Listable task tracker — produces "LTT69717: Title" from two view layouts:
 *
 *  1. Grid / detail view: a formula cell contains "LTT69717/Title" as a single
 *     string with `.heading-size-default`.
 *  2. Sidesheet view: the title is a plain text cell and the LTT number lives
 *     in a separate formula cell as a go link ("https://go/LTT72498").
 *
 * All URLs are canonicalized to the fullscreen view page for stable links.
 */
export const listableConfig: AirtableBaseConfig = {
    label: 'Listable Record',
    appId: LISTABLE_APP_ID,
    canonicalizeUrl: (url) => {
        const recordId = extractRecordId(url);
        return recordId
            ? `https://airtable.com/${LISTABLE_APP_ID}/${FULLSCREEN_PAGE_ID}/${recordId}`
            : url;
    },
    extractTitle: () => {
        // Strategy 1: formula cell with "LTT69717/Title" (grid/detail views)
        const combined = extractCombinedFormulaTitle();
        if (combined) return truncateWithEllipsis(combined, DEFAULT_MAX_TITLE_LEN);

        // Strategy 2: separate text cell + go-link formula cell (sidesheet view)
        const title = extractTextCellTitle();
        if (!title) return null;

        const ltt = extractLttFromGoLink();
        const full = ltt ? `${ltt}: ${title}` : title;
        return truncateWithEllipsis(full, DEFAULT_MAX_TITLE_LEN);
    },
};

// --- URL helpers ---

function extractRecordId(url: string): string | null {
    const u = new URL(url);

    // Path: /appXXX/pagXXX/recXXX
    const pathMatch = u.pathname.match(/\/(rec[A-Za-z0-9]+)/);
    if (pathMatch) return pathMatch[1];

    // Detail panel: ?detail=base64JSON with { rowId: "recXXX" }
    const detail = u.searchParams.get('detail');
    if (detail) {
        try {
            const json = JSON.parse(globalThis.atob(detail));
            if (json.rowId) return json.rowId;
        } catch {
            // fall through
        }
    }

    // Query param value: ?someKey=recXXX
    for (const val of u.searchParams.values()) {
        if (/^rec[A-Za-z0-9]+$/.test(val)) return val;
    }
    return null;
}

// --- DOM helpers ---

/** Grid/detail view: formula cell heading with "LTT69717/Title" format. */
function extractCombinedFormulaTitle(): string | null {
    const cell = document.querySelector(
        '[data-testid="cell-editor"][data-columntype="formula"] .heading-size-default',
    );
    const raw = cell?.textContent?.trim();
    if (!raw) return null;
    const i = raw.indexOf('/');
    return i !== -1 ? `${raw.slice(0, i)}: ${raw.slice(i + 1)}` : raw;
}

/** Sidesheet view: first text cell-editor holds the raw title. */
function extractTextCellTitle(): string | null {
    const cell = document.querySelector('[data-testid="cell-editor"][data-columntype="text"]');
    return cell?.textContent?.trim() || null;
}

/** Sidesheet view: extract LTT number from a go-link formula cell ("https://go/LTT72498"). */
function extractLttFromGoLink(): string | null {
    const cells = document.querySelectorAll(
        '[data-testid="cell-editor"][data-columntype="formula"]',
    );
    for (const cell of cells) {
        const text = cell.textContent?.trim();
        const match = text?.match(/go\/(LTT\d+)/);
        if (match) return match[1];
    }
    return null;
}
