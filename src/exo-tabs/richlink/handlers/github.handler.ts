import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

export class GitHubHandler extends Handler {
    readonly label: string = 'GitHub PR';
    readonly priority: number = 10;

    // URL segment index for the PR number in github.com/org/repo/pull/{number}
    protected static readonly PR_NUMBER_INDEX = 6;

    /** Extract the PR number from a GitHub PR URL, or undefined if not found. */
    protected parsePrNumber(url: string): string | undefined {
        const raw = url.split('/')[GitHubHandler.PR_NUMBER_INDEX]?.split('?')[0];
        return raw && /^\d+$/.test(raw) ? raw : undefined;
    }

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

        return (
            domain === 'github.com' &&
            !!org &&
            org !== '' &&
            !!repo &&
            repo !== '' &&
            pullKeyword === 'pull' &&
            !!this.parsePrNumber(url)
        );
    }

    /** Strip sub-pages (/files, /changes, /commits, /checks, etc.) from GitHub PR URLs. */
    private canonicalUrl(url: string): string {
        const parts = url.split('/');
        // Keep: https://github.com/org/repo/pull/number (indices 0–6)
        return parts.slice(0, 7).join('/');
    }

    getFormat(ctx: FormatContext): LinkFormat {
        const title = this.extractLinkText(ctx);
        const url = this.canonicalUrl(ctx.url);
        return {
            label: this.label,
            html: `<a href="${url}">${title}</a>`,
            text: `${title} (${url})`,
        };
    }

    extractLinkText({url}: FormatContext): string {
        // Extract PR title from page - try multiple selectors for different GitHub layouts
        const titleElement =
            document.querySelector('.markdown-title') ||
            document.querySelector('.gh-header-title') ||
            document.querySelector('.js-issue-title');

        if (!titleElement?.textContent) {
            return 'GitHub PR';
        }

        const title = titleElement.textContent.trim();
        const prNumber = this.parsePrNumber(url);
        return prNumber ? `${title} (#${prNumber})` : title;
    }
}
