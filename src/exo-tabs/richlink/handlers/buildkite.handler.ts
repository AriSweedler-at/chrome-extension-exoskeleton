import {Handler, type FormatContext} from '@exo/exo-tabs/richlink/base';

export class BuildkiteHandler extends Handler {
    readonly label = 'BuildKite Pipeline';
    readonly priority = 65;

    canHandle(url: string): boolean {
        return url.includes('buildkite.com');
    }

    extractLinkText({url}: FormatContext): string {
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
}
