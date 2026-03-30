import {linkFormat} from '@exo/exo-tabs/richlink/base';
import type {AirtableSubHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {canonicalAirtableUrl} from '@exo/exo-tabs/richlink/handlers/airtable/url-utils';

/** Known Escalations base appId. */
const ESCALATIONS_APP_ID = 'appWh5G6JXbHDKC2b';

export const escalationHandler: AirtableSubHandler = {
    canHandle(url: URL): boolean {
        return url.href.includes(ESCALATIONS_APP_ID);
    },

    getFormats({url}) {
        const canonicalUrl = canonicalAirtableUrl(url);

        const formulaCell = document.querySelector(
            '[data-testid="cell-editor"][data-columntype="formula"] .heading-size-default',
        );

        const title = formulaCell?.textContent?.trim() || 'Escalation';

        return [linkFormat('Escalation', 35, title, canonicalUrl)];
    },
};
