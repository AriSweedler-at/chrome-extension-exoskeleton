import {linkFormat, prefixedTitle} from '@exo/exo-tabs/richlink/base';
import type {
    AirtableBaseConfig,
    AirtableSubHandler,
} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {canonicalAirtableUrl} from '@exo/exo-tabs/richlink/handlers/airtable/url-utils';
import {glossaryConfig} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/glossary/glossary';

export const DEFAULT_MAX_TITLE_LEN = 120;

function defaultExtractTitle(): string | null {
    return (
        document
            .querySelector(
                '[data-testid="cell-editor"][data-columntype="formula"] .heading-size-default',
            )
            ?.textContent?.trim() || null
    );
}

export function createSubHandler(config: AirtableBaseConfig): AirtableSubHandler {
    return {
        canHandle: (url) => url.href.includes(config.appId),
        getFormats({url}) {
            const canonicalize = config.canonicalizeUrl ?? canonicalAirtableUrl;
            const rawTitle = (config.extractTitle ?? defaultExtractTitle)();
            const maxLen = config.maxTitleLen ?? DEFAULT_MAX_TITLE_LEN;

            let displayTitle: string;
            if (config.prefix && rawTitle) {
                displayTitle = prefixedTitle(config.prefix, rawTitle, maxLen);
            } else {
                displayTitle = rawTitle || config.label;
            }

            return [linkFormat(config.label, 35, displayTitle, canonicalize(url))];
        },
    };
}

export const airtableBases: AirtableBaseConfig[] = [
    {
        label: 'Escalations',
        appId: 'appWh5G6JXbHDKC2b',
        domain: 'escalations.airtable.app',
        prefix: 'Escalation',
    },
    {
        label: 'Listable Record',
        appId: 'apptivTqaoebkrmV1',
        extractTitle: () => {
            const cell = document.querySelector(
                '[data-testid="cell-editor"][data-columntype="formula"] .heading-size-default',
            );
            const raw = cell?.textContent?.trim();
            if (!raw) return null;
            const i = raw.indexOf('/');
            return i !== -1 ? `${raw.slice(0, i)}: ${raw.slice(i + 1)}` : raw;
        },
    },
    {
        label: 'Security Exception',
        appId: 'appjBm1uPTsu1yTVU',
        prefix: 'Security Exception',
        extractTitle: () => {
            const textCell = document.querySelector(
                '[data-testid="cell-editor"][data-columntype="text"]',
            );
            const title = textCell?.textContent?.trim() ?? 'unknown title';
            const dateCell = document.querySelector(
                '[data-testid="cell-editor"][data-columntype="date"] .heading-size-default',
            );
            const reReviewDate = dateCell?.textContent?.trim();
            return reReviewDate ? `${title} (re-review ${reReviewDate})` : title;
        },
    },
    glossaryConfig,
];

export const registeredHandlers = airtableBases.map(createSubHandler);

export const customDomains = airtableBases
    .map((b) => b.domain)
    .filter((d): d is string => d != null);
