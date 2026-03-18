import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

type PageType = 'Scorecard' | 'Interview Kit' | 'Candidate' | 'Job';

export class GreenhouseHandler extends Handler {
    canHandle(url: URL): boolean {
        return url.hostname.endsWith('.greenhouse.io');
    }

    private extractCandidateName(): string | undefined {
        const el = document.querySelector('h3.name > span');
        return el?.textContent?.trim() || undefined;
    }

    private extractJobTitle(): string | undefined {
        const el = document.querySelector('div.hiring-plan');
        return el?.textContent?.trim() || undefined;
    }

    private parsePageType(path: string): PageType | undefined {
        if (/^\/scorecards\/\d+/.test(path)) return 'Scorecard';
        if (/^\/guides\/\d+\/people\/\d+/.test(path)) return 'Interview Kit';
        if (/^\/people\/\d+/.test(path)) return 'Candidate';
        if (/^\/plans\/\d+/.test(path)) return 'Job';
        return undefined;
    }

    private extractLinkText(url: string): string {
        const path = new URL(url).pathname;
        const pageType = this.parsePageType(path);
        const name = this.extractCandidateName();
        const job = this.extractJobTitle();

        // Build: Greenhouse: {PageType}: {Name} ({Job})
        const parts: string[] = ['Greenhouse'];
        if (pageType) parts.push(pageType);
        if (name && job) {
            parts.push(`${name} (${job})`);
        } else if (name) {
            parts.push(name);
        } else if (job) {
            parts.push(job);
        }

        return parts.join(': ');
    }

    getFormats(ctx: FormatContext): LinkFormat[] {
        const title = this.extractLinkText(ctx.url);
        return [
            {
                label: 'Greenhouse',
                priority: 50,
                html: `<a href="${ctx.url}">${title}</a>`,
                text: `${title} (${ctx.url})`,
            },
        ];
    }
}
