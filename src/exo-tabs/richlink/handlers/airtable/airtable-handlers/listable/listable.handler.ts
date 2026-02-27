import type {FormatContext, LinkFormat} from '@exo/exo-tabs/richlink/base';
import type {AirtableSubHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {canonicalAirtableUrl} from '@exo/exo-tabs/richlink/handlers/airtable/url-utils';

/** Known Listable base appId. */
const LISTABLE_APP_ID = 'apptivTqaoebkrmV1';

export const listableHandler: AirtableSubHandler = {
    canHandle(url: string): boolean {
        return url.includes(LISTABLE_APP_ID);
    },

    getFormats({url}: FormatContext): LinkFormat[] {
        const canonicalUrl = canonicalAirtableUrl(url);

        // Listable record: first cell-editor is a formula field with "LTT#/Title"
        const formulaCell = document.querySelector(
            '[data-testid="cell-editor"][data-columntype="formula"] .heading-size-default',
        );

        let title = 'Listable Record';
        if (formulaCell?.textContent) {
            const raw = formulaCell.textContent.trim();
            // Convert "LTT69717/Title text" → "LTT69717: Title text"
            const slashIdx = raw.indexOf('/');
            title = slashIdx !== -1 ? `${raw.slice(0, slashIdx)}: ${raw.slice(slashIdx + 1)}` : raw;
        }

        return [
            {
                label: 'Listable Record',
                priority: 35,
                html: `<a href="${canonicalUrl}">${title}</a>`,
                text: `${title} (${canonicalUrl})`,
            },
        ];
    },
};
