import {Handler, type FormatContext} from '@exo/exo-tabs/richlink/base';

export class BuildkiteHandler extends Handler {
    readonly label = 'BuildKite Pipeline';
    readonly priority = 65;

    canHandle(url: string): boolean {
        return url.includes('buildkite.com');
    }

    extractLinkText(_ctx: FormatContext): string {
        // Extract pipeline name from URL path: buildkite.com/{org}/{pipeline}
        const match = window.location.pathname.match(/^\/[^/]+\/([^/]+)/);
        if (match) {
            const pipeline = match[1].replace(/\.airtable$/, '');
            return `BuildKite: ${pipeline}`;
        }
        return 'BuildKite';
    }
}
