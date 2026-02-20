import {Handler} from '@exo/library/richlink/base';

export class GitHubHandler extends Handler {
    canHandle(url: string): boolean {
        // Handle GitHub PR URLs including sub-pages:
        // github.com/org/repo/pull/number
        // github.com/org/repo/pull/number/files
        // github.com/org/repo/pull/number/commits
        // github.com/org/repo/pull/number/checks
        // etc.

        if (!url.includes('github.com/')) {
            return false;
        }

        const parts = url.split('/');
        // Expected format: https://github.com/org/repo/pull/number[/subpath]
        // parts: ['https:', '', 'github.com', 'org', 'repo', 'pull', 'number', ...optional subpath]

        if (parts.length < 7) {
            return false;
        }

        const domain = parts[2];
        const org = parts[3];
        const repo = parts[4];
        const pullKeyword = parts[5];
        const prNumber = parts[6]?.split('?')[0]; // Remove query params if present

        return (
            domain === 'github.com' &&
            !!org &&
            org !== '' &&
            !!repo &&
            repo !== '' &&
            pullKeyword === 'pull' &&
            !!prNumber &&
            /^\d+$/.test(prNumber)
        );
    }

    getLabel(): string {
        return 'GitHub PR';
    }

    async getHtml(): Promise<string> {
        const formattedTitle = this.extractFormattedTitle();
        const url = window.location.href;
        return `<a href="${url}">${formattedTitle}</a>`;
    }

    async getText(): Promise<string> {
        const formattedTitle = this.extractFormattedTitle();
        const url = window.location.href;
        return `${formattedTitle} (${url})`;
    }

    getPriority(): number {
        return 10;
    }

    private extractFormattedTitle(): string {
        // Extract PR title from page - try multiple selectors for different GitHub layouts
        const titleElement =
            document.querySelector('.markdown-title') ||
            document.querySelector('.gh-header-title') ||
            document.querySelector('.js-issue-title');

        if (!titleElement?.textContent) {
            return 'GitHub PR';
        }

        const title = titleElement.textContent.trim();

        // Extract PR number from URL
        const url = window.location.href;
        const parts = url.split('/');
        const prNumberRaw = parts[6]; // Position of PR number in URL

        if (prNumberRaw) {
            // Remove query params and extract just the number
            const prNumber = prNumberRaw.split('?')[0];
            if (/^\d+$/.test(prNumber)) {
                return `${title} (#${prNumber})`;
            }
        }

        return title;
    }
}
