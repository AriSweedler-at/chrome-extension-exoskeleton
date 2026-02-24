import {Handler} from '@exo/exo-tabs/richlink/base';

export class BuildkiteHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('buildkite.com');
    }

    getLabel(): string {
        return 'BuildKite Pipeline';
    }

    getPriority(): number {
        return 65;
    }

    extractTitle(): string {
        // Extract pipeline name from URL path: buildkite.com/{org}/{pipeline}
        const match = window.location.pathname.match(/^\/[^/]+\/([^/]+)/);
        if (match) {
            const pipeline = match[1].replace(/\.airtable$/, '');
            return `BuildKite: ${pipeline}`;
        }
        return 'BuildKite';
    }
}
