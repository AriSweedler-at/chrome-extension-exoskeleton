import type {AirtableBaseConfig} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {DEFAULT_MAX_TITLE_LEN} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {prefixedTitle} from '@exo/exo-tabs/richlink/base';

const GRIDGUARD_APP_ID = 'app8A8BeDXriEmo9o';

/**
 * GridGuard vulnerability tracker — produces "GridGuard vuln: <container> (<record-id>)".
 *
 * Both the single-record view and the sidesheet view render the same
 * cell-editor structure for the primary fields:
 *  - 1st formula cell-editor: record id (e.g. "rad.dkr.4530")
 *  - a later formula cell-editor matching /^Container (\S+):/ holds the
 *    container name (e.g. "aws-cli")
 */
export const gridguardConfig: AirtableBaseConfig = {
    label: 'GridGuard vuln',
    appId: GRIDGUARD_APP_ID,
    extractTitle: (label) => {
        const cells = document.querySelectorAll<HTMLElement>(
            '[data-testid="cell-editor"][data-columntype="formula"]',
        );
        const recordId = cells[0]?.textContent?.trim();
        if (!recordId) return null;

        let container: string | null = null;
        for (const cell of cells) {
            const match = cell.textContent?.trim().match(/^Container (\S+):/);
            if (match) {
                container = match[1];
                break;
            }
        }

        const body = container ? `${container} (${recordId})` : recordId;
        return prefixedTitle(label, body, DEFAULT_MAX_TITLE_LEN);
    },
};
