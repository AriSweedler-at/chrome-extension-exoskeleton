import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

export class GitHubHandler extends Handler {
    // URL segment index for the PR number in github.com/org/repo/pull/{number}
    protected static readonly PR_NUMBER_INDEX = 6;

    /** Extract the PR number from a GitHub PR URL, or undefined if not found. */
    protected parsePrNumber(url: string): string | undefined {
        const raw = url.split('/')[GitHubHandler.PR_NUMBER_INDEX]?.split('?')[0];
        return raw && /^\d+$/.test(raw) ? raw : undefined;
    }

    canHandle(url: URL): boolean {
        if (url.hostname !== 'github.com') return false;

        // Expected: /org/repo/pull/number[/subpath]
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length < 4) return false;

        return parts[2] === 'pull' && !!this.parsePrNumber(url.href);
    }

    /** Strip sub-pages (/files, /changes, /commits, /checks, etc.) from GitHub PR URLs. */
    private canonicalUrl(url: string): string {
        const parts = url.split('/');
        // Keep: https://github.com/org/repo/pull/number (indices 0–6)
        return parts.slice(0, 7).join('/');
    }

    private extractLinkText({url}: FormatContext): string {
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

    getFormats(ctx: FormatContext): LinkFormat[] {
        const title = this.extractLinkText(ctx);
        const url = this.canonicalUrl(ctx.url);
        return [
            {
                label: 'GitHub PR',
                priority: 10,
                html: `<a href="${url}">${title}</a>`,
                text: `${title} (${url})`,
            },
        ];
    }
}
