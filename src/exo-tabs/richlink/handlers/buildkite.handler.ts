import {Handler, type FormatContext} from '@exo/exo-tabs/richlink/base';

// First path segments that are BuildKite app routes, not organization slugs.
const RESERVED_FIRST_SEGMENTS = new Set(['organizations', 'user', 'docs', 'builds']);

export class BuildkiteHandler extends Handler {
    readonly label = 'BuildKite Pipeline';
    readonly priority = 65;

    canHandle(url: URL): boolean {
        return url.hostname === 'buildkite.com';
    }

    extractLinkText({url}: FormatContext): string {
        // Extract pipeline name and optional build number from URL path:
        // buildkite.com/{org}/{pipeline}[/builds/{number}]
        const path = new URL(url).pathname;
        const match = path.match(/^\/([^/]+)\/([^/]+)(?:\/builds\/(\d+))?/);
        if (match && !RESERVED_FIRST_SEGMENTS.has(match[1])) {
            const pipeline = decodeURIComponent(match[2]).replace(/\.airtable$/, '');
            const buildNumber = match[3];
            return buildNumber
                ? `BuildKite: ${pipeline} (#${buildNumber})`
                : `BuildKite: ${pipeline}`;
        }
        return 'BuildKite';
    }
}
