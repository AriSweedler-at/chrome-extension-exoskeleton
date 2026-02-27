import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

export class BuildkiteHandler extends Handler {
    canHandle(url: string): boolean {
        try {
            return new URL(url).hostname === 'buildkite.com';
        } catch {
            return false;
        }
    }

    private extractLinkText(url: string): string {
        // Extract pipeline name and optional build number from URL path:
        // buildkite.com/{org}/{pipeline}[/builds/{number}]
        const path = new URL(url).pathname;
        const match = path.match(/^\/[^/]+\/([^/]+)(?:\/builds\/(\d+))?/);
        if (match) {
            const pipeline = match[1].replace(/\.airtable$/, '');
            const buildNumber = match[2];
            return buildNumber
                ? `BuildKite: ${pipeline} (#${buildNumber})`
                : `BuildKite: ${pipeline}`;
        }
        return 'BuildKite';
    }

    getFormats(ctx: FormatContext): LinkFormat[] {
        const title = this.extractLinkText(ctx.url);
        return [
            {
                label: 'BuildKite Pipeline',
                priority: 65,
                html: `<a href="${ctx.url}">${title}</a>`,
                text: `${title} (${ctx.url})`,
            },
        ];
    }
}
