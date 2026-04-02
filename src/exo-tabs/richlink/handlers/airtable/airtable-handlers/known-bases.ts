import type {AirtableBaseConfig} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {prefixedTitle} from '@exo/exo-tabs/richlink/base';
import {glossaryConfig} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/known-base-glossary';

export const DEFAULT_MAX_TITLE_LEN = 120;

/**
 * Declarative registry of known Airtable bases.
 *
 * To add a new base, append an entry here. The factory in
 * handler-factory.ts handles canHandle, URL canonicalization, and
 * fallback automatically.
 *
 * extractTitle(label) receives the label so it can prefix if desired.
 */
export const airtableBases: AirtableBaseConfig[] = [
    /** SO Escalations tracker — prefixed "Escalation: <title>" */
    {
        label: 'Escalation',
        appId: 'appWh5G6JXbHDKC2b',
        domain: 'escalations.airtable.app',
        extractTitle: (label) => {
            const cell = document.querySelector(
                '[data-testid="cell-editor"][data-columntype="formula"] .heading-size-default',
            );
            const raw = cell?.textContent?.trim();
            return raw ? prefixedTitle(label, raw, DEFAULT_MAX_TITLE_LEN) : null;
        },
    },
    /** Listable task tracker — converts "LTT69717/Title" → "LTT69717: Title" */
    {
        label: 'Listable Record',
        appId: 'apptivTqaoebkrmV1',
        extractTitle: () => {
            // Primary: formula cell with "LTT69717/Title" format (grid/detail views)
            const formulaCell = document.querySelector(
                '[data-testid="cell-editor"][data-columntype="formula"] .heading-size-default',
            );
            const raw = formulaCell?.textContent?.trim();
            if (raw) {
                const i = raw.indexOf('/');
                return i !== -1 ? `${raw.slice(0, i)}: ${raw.slice(i + 1)}` : raw;
            }

            // Fallback: text cell with raw title (sidesheet view)
            const textCell = document.querySelector(
                '[data-testid="cell-editor"][data-columntype="text"]',
            );
            return textCell?.textContent?.trim() || null;
        },
    },
    /** Security exception requests — prefixed, with optional re-review date */
    {
        label: 'Security Exception',
        appId: 'appjBm1uPTsu1yTVU',
        extractTitle: (label) => {
            const textCell = document.querySelector(
                '[data-testid="cell-editor"][data-columntype="text"]',
            );
            const title = textCell?.textContent?.trim() ?? 'unknown title';
            const dateCell = document.querySelector(
                '[data-testid="cell-editor"][data-columntype="date"] .heading-size-default',
            );
            const reReviewDate = dateCell?.textContent?.trim();
            const body = reReviewDate ? `${title} (re-review ${reReviewDate})` : title;
            return prefixedTitle(label, body, DEFAULT_MAX_TITLE_LEN);
        },
    },
    /** Airtable Glossary — custom URL canonicalization and definition expansion */
    glossaryConfig,
];
