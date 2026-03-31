import type {AirtableBaseConfig} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';

const GLOSSARY_APP_ID = 'appebZJp08MytrQhs';
const MAX_LABEL_LENGTH = 100;

export const glossaryConfig: AirtableBaseConfig = {
    label: 'Airtable Glossary',
    appId: GLOSSARY_APP_ID,
    extractTitle: (_label) => {
        const textCell = document.querySelector(
            '[data-testid="cell-editor"][data-columntype="text"]',
        );
        const name = textCell?.textContent?.trim() || 'Glossary Record';
        return buildLabel(name);
    },
    canonicalizeUrl: (url) => {
        const recordId = extractRecordId(url);
        return recordId ? `https://airtable.com/${GLOSSARY_APP_ID}/${recordId}` : url;
    },
};

// --- URL helpers ---

function extractRecordId(url: string): string | null {
    const u = new URL(url);
    const pathMatch = u.pathname.match(/\/(rec[A-Za-z0-9]+)/);
    if (pathMatch) return pathMatch[1];
    for (const val of u.searchParams.values()) {
        if (/^rec[A-Za-z0-9]+$/.test(val)) return val;
    }
    return null;
}

// --- Label building ---

/**
 * Build the display label from the Definition field's first sentence.
 *
 * The first sentence of each glossary entry IS the expansion, sometimes
 * prefixed with "{name} stands for ..." or "{name} is/are ...".
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

function extractExpansion(name: string, sentence: string): string | null {
    let expansion = sentence;

    const prefix = new RegExp(`^${escapeRegExp(name)}\\s+(?:stands\\s+for|is|are|means)\\s+`, 'i');
    const prefixMatch = expansion.match(prefix);
    if (prefixMatch) {
        expansion = expansion.slice(prefixMatch[0].length);
    }

    expansion = expansion.replace(/\.\s*$/, '');
    expansion = expansion.replace(/[,;]\s+(?:which|that|from which|where|so|but|via|see)\s.*/i, '');
    expansion = expansion.replace(/\.\s+.*$/, '');
    expansion = expansion.replace(/\s*\([^)]*\)/g, '').trim();

    const wordCount = expansion.split(/\s+/).length;
    const hadPrefix = !!prefixMatch;
    if (!hadPrefix && wordCount > 8) return null;

    return expansion || null;
}

// --- DOM helpers ---

function findDefinitionCell(): Element | null {
    const pairs = document.querySelectorAll('.labelCellPair');
    for (const pair of pairs) {
        const label = pair.querySelector('.fieldLabel');
        if (label?.textContent?.trim() === 'Definition') {
            return pair.querySelector('[data-testid="cell-editor"][data-columntype="richText"]');
        }
    }

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
