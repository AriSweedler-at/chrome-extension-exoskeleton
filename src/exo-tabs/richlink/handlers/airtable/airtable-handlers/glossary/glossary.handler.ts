import type {FormatContext, LinkFormat} from '@exo/exo-tabs/richlink/base';
import type {AirtableSubHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';

/** Known Glossary base appId. */
const GLOSSARY_APP_ID = 'appebZJp08MytrQhs';

/**
 * Extract a record ID from an Airtable URL.
 *
 * Handles two patterns:
 *  - Old-style: /appXXX/tblYYY/viwZZZ/recXXX  (rec in path)
 *  - Interfaces: /appXXX/pagXXX?someKey=recXXX  (rec as query param value)
 */
function extractRecordId(url: string): string | null {
    const u = new URL(url);

    // Path segment: /recXXX
    const pathMatch = u.pathname.match(/\/(rec[A-Za-z0-9]+)/);
    if (pathMatch) return pathMatch[1];

    // Query param value: ?anyKey=recXXX
    for (const val of u.searchParams.values()) {
        if (/^rec[A-Za-z0-9]+$/.test(val)) return val;
    }

    return null;
}

function buildRecordUrl(recordId: string): string {
    return `https://airtable.com/${GLOSSARY_APP_ID}/${recordId}`;
}

const MAX_LABEL_LENGTH = 100;

/**
 * Build the display label from the Definition field's first sentence.
 *
 * The first sentence of each glossary entry IS the expansion, sometimes
 * prefixed with "{name} stands for ..." or "{name} is/are ...".
 *
 * Examples:
 *   SSP  + "SSP stands for Single-Service Pipeline."  → "SSP: Single-Service Pipeline"
 *   ATL  + "Above the line (Director, VPs, C-suite)"  → "ATL: Above the line"
 *   ARR  + "Annual recurring revenue."                 → "ARR: Annual recurring revenue"
 *   SLA  + "service-level agreement"                   → "SLA: service-level agreement"
 *
 * Falls back to just "Airtable Glossary: {name}" when there's no definition
 * or the expanded label would exceed MAX_LABEL_LENGTH.
 */
function buildLabel(name: string): string {
    const short = `Airtable Glossary: ${name}`;

    const definition = extractDefinitionFirstSentence();
    if (!definition) return short;

    const expansion = extractExpansion(name, definition);
    if (!expansion) return short;

    const long = `Airtable Glossary: ${name}: ${expansion}`;
    return long.length <= MAX_LABEL_LENGTH ? long : short;
}

/**
 * Extract the expansion from a definition sentence.
 *
 * 1. Strip "{name} stands for / is / are " prefix if present
 * 2. Strip trailing period
 * 3. Strip trailing parenthetical  e.g. "(Director, VPs, C-suite)"
 */
function extractExpansion(name: string, sentence: string): string | null {
    let expansion = sentence;

    // Strip known prefixes: "XXX stands for ...", "XXX is/are ..."
    const prefix = new RegExp(`^${escapeRegExp(name)}\\s+(?:stands\\s+for|is|are)\\s+`, 'i');
    const prefixMatch = expansion.match(prefix);
    if (prefixMatch) {
        expansion = expansion.slice(prefixMatch[0].length);
    }

    // Strip trailing period
    expansion = expansion.replace(/\.\s*$/, '');

    // Strip trailing parenthetical
    expansion = expansion.replace(/\s*\([^)]*\)\s*$/, '');

    return expansion || null;
}

/**
 * Find the Definition field's richText cell.
 *
 * Two DOM layouts:
 *  - Old-style (data view): .labelCellPair with .fieldLabel "Definition"
 *  - Interfaces view: a <span> "Definition" label with the cell-editor in a nearby ancestor
 */
function findDefinitionCell(): Element | null {
    // Old-style: labelCellPair
    const pairs = document.querySelectorAll('.labelCellPair');
    for (const pair of pairs) {
        const label = pair.querySelector('.fieldLabel');
        if (label?.textContent?.trim() === 'Definition') {
            return pair.querySelector('[data-testid="cell-editor"][data-columntype="richText"]');
        }
    }

    // Interfaces: span label near a richText cell
    const spans = document.querySelectorAll('span');
    for (const span of spans) {
        if (span.textContent?.trim() !== 'Definition') continue;
        let container = span.parentElement;
        for (let i = 0; i < 5 && container; i++) {
            const rt = container.querySelector(
                '[data-testid="cell-editor"][data-columntype="richText"]',
            );
            if (rt) return rt;
            container = container.parentElement;
        }
    }

    return null;
}

function extractDefinitionFirstSentence(): string | null {
    const cell = findDefinitionCell();
    if (!cell?.textContent) return null;
    const text = cell.textContent.trim();
    const dotIdx = text.indexOf('.');
    return dotIdx !== -1 ? text.slice(0, dotIdx + 1) : text;
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const glossaryHandler: AirtableSubHandler = {
    canHandle(url: URL): boolean {
        return url.href.includes(GLOSSARY_APP_ID);
    },

    getFormats({url}: FormatContext): LinkFormat[] {
        const recordId = extractRecordId(url);
        const canonicalUrl = recordId ? buildRecordUrl(recordId) : url;

        const textCell = document.querySelector(
            '[data-testid="cell-editor"][data-columntype="text"]',
        );
        const name = textCell?.textContent?.trim() || 'Glossary Record';
        const label = buildLabel(name);

        return [
            {
                label: 'Airtable Glossary',
                priority: 35,
                html: `<a href="${canonicalUrl}">${label}</a>`,
                text: `${label} (${canonicalUrl})`,
            },
        ];
    },
};
