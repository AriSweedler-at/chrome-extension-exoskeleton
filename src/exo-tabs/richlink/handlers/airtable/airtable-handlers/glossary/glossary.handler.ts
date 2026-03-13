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
 * Build the display label. If the definition starts with "{name} stands for ..."
 * and the expanded form fits within MAX_LABEL_LENGTH, include it.
 * Otherwise just use "Airtable Glossary: {name}".
 */
function buildLabel(name: string): string {
    const short = `Airtable Glossary: ${name}`;

    const definition = extractDefinitionFirstSentence();
    if (!definition) return short;

    // Match "XXX stands for Something."
    const standsForPattern = new RegExp(`^${escapeRegExp(name)}\\s+stands\\s+for\\s+`, 'i');
    const match = definition.match(standsForPattern);
    if (!match) return short;

    const expansion = definition.slice(match[0].length).replace(/\.?\s*$/, '');
    if (!expansion) return short;

    const long = `Airtable Glossary: ${name}: ${expansion}`;
    return long.length <= MAX_LABEL_LENGTH ? long : short;
}

function extractDefinitionFirstSentence(): string | null {
    const richTextCell = document.querySelector(
        '[data-testid="cell-editor"][data-columntype="richText"]',
    );
    if (!richTextCell?.textContent) return null;
    const text = richTextCell.textContent.trim();
    // Take just the first sentence
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
