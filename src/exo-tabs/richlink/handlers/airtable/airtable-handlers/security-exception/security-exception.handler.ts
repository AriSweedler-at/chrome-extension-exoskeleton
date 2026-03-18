import {
    linkFormat,
    truncateWithEllipsis,
    type FormatContext,
    type LinkFormat,
} from '@exo/exo-tabs/richlink/base';
import type {AirtableSubHandler} from '@exo/exo-tabs/richlink/handlers/airtable/airtable-handlers/base';
import {canonicalAirtableUrl} from '@exo/exo-tabs/richlink/handlers/airtable/url-utils';

/** Known Security Exceptions base appId. */
const SECURITY_EXCEPTIONS_APP_ID = 'appjBm1uPTsu1yTVU';

export const securityExceptionHandler: AirtableSubHandler = {
    canHandle(url: URL): boolean {
        return url.href.includes(SECURITY_EXCEPTIONS_APP_ID);
    },

    getFormats({url}: FormatContext): LinkFormat[] {
        const canonicalUrl = canonicalAirtableUrl(url);
        const title = extractTitle();
        const reReviewDate = extractReReviewDate();

        const truncated = truncateWithEllipsis(title ?? 'unknown title', 40);
        const label = reReviewDate
            ? `Security Exception: ${truncated} (re-review ${reReviewDate})`
            : `Security Exception: ${truncated}`;

        return [linkFormat('Security Exception', 35, label, canonicalUrl)];
    },
};

/** Extract the risk name from the first text-type cell-editor. */
function extractTitle(): string | null {
    const textCell = document.querySelector('[data-testid="cell-editor"][data-columntype="text"]');
    return textCell?.textContent?.trim() || null;
}

/** Extract the "Date to Re-review" from the date-type cell-editor. */
function extractReReviewDate(): string | null {
    const dateCell = document.querySelector(
        '[data-testid="cell-editor"][data-columntype="date"] .heading-size-default',
    );
    return dateCell?.textContent?.trim() ?? null;
}
