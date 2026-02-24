import {Handler, type FormatContext} from '@exo/exo-tabs/richlink/base';

export class AtlassianHandler extends Handler {
    get label(): string {
        const url = window.location.href;
        if (url.includes('/wiki/')) return 'Confluence Page';
        if (url.includes('/browse/')) return 'Jira Issue';
        return 'Atlassian Page';
    }

    readonly priority = 30;

    canHandle(url: string): boolean {
        return url.includes('atlassian.net');
    }

    extractLinkText({url}: FormatContext): string {
        // Confluence page title
        // TODO: Verify this selector works across different Confluence versions
        if (url.includes('/wiki/')) {
            const titleElement = document.getElementById('title-text');
            if (titleElement?.textContent) {
                return titleElement.textContent.trim();
            }
            return 'Confluence Page';
        }

        // Jira issue title
        // TODO: Verify these selectors work across different Jira versions
        if (url.includes('/browse/')) {
            // Modern Jira selector
            const summaryElement = document.querySelector(
                '[data-test-id="issue.views.issue-base.foundation.summary.heading"]',
            );
            if (summaryElement?.textContent) {
                return summaryElement.textContent.trim();
            }

            // Classic Jira selector
            const classicSummary = document.getElementById('summary-val');
            if (classicSummary?.textContent) {
                return classicSummary.textContent.trim();
            }

            return 'Jira Issue';
        }

        return 'Atlassian Page';
    }
}
