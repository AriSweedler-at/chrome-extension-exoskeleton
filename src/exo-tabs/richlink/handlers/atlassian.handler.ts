import {Handler} from '@exo/exo-tabs/richlink/base';

export class AtlassianHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('atlassian.net');
    }

    getLabel(): string {
        const url = window.location.href;
        if (url.includes('/wiki/')) {
            return 'Confluence Page';
        }
        if (url.includes('/browse/')) {
            return 'Jira Issue';
        }
        return 'Atlassian Page';
    }

    async getHtml(): Promise<string> {
        const title = this.extractTitle();
        const url = window.location.href;
        return `<a href="${url}">${title}</a>`;
    }

    async getText(): Promise<string> {
        const title = this.extractTitle();
        const url = window.location.href;
        return `${title} (${url})`;
    }

    getPriority(): number {
        return 30;
    }

    private extractTitle(): string {
        const url = window.location.href;

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
