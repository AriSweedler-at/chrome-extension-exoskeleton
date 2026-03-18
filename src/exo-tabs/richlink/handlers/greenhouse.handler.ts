import {Handler} from '@exo/exo-tabs/richlink/base';

export class GreenhouseHandler extends Handler {
    readonly label = 'Greenhouse Scorecard';
    readonly priority = 50;

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

    extractLinkText(): string {
        const name = this.extractCandidateName();
        const job = this.extractJobTitle();

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
}
