import {
    Handler,
    linkFormat,
    type FormatContext,
    type LinkFormat,
} from '@exo/exo-tabs/richlink/base';

export class GreenhouseHandler extends Handler {
    canHandle(url: URL): boolean {
        return url.hostname.endsWith('.greenhouse.io') && /^\/scorecards\/\d+/.test(url.pathname);
    }

    private extractCandidateName(): string | undefined {
        const el = document.querySelector('h3.name > span');
        return el?.textContent?.trim() || undefined;
    }

    private extractJobTitle(): string | undefined {
        const el = document.querySelector('div.hiring-plan');
        return el?.textContent?.trim() || undefined;
    }

    private extractLinkText(): string {
        const name = this.extractCandidateName();
        const job = this.extractJobTitle();

        // Build: Greenhouse: Scorecard: {Name} ({Job})
        const parts: string[] = ['Greenhouse', 'Scorecard'];
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
        return [linkFormat('Greenhouse Scorecard', 50, this.extractLinkText(), ctx.url)];
    }
}
