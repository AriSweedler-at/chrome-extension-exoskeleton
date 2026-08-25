import {Handler, prefixedTitle, type FormatContext} from '@exo/exo-tabs/richlink/base';
import {SPACELIFT_HOSTNAME} from '@exo/exo-tabs/spacelift';
import {queryFirstText} from '@exo/lib/dom';

export class SpaceliftHandler extends Handler {
    readonly label = 'Spacelift Stack';
    readonly priority = 60;

    canHandle(url: URL): boolean {
        return url.hostname === SPACELIFT_HOSTNAME;
    }

    static readonly TOTAL_MAX_LEN = 90;

    private parseStackName(url: string): string | undefined {
        const match = new URL(url).pathname.match(/^\/stack\/([^/]+)/);
        return match?.[1];
    }

    private getPageTitle(): string | undefined {
        return queryFirstText(['.run-title', '.stack-name', 'h1']) ?? undefined;
    }

    extractLinkText({url}: FormatContext): string {
        const stackName = this.parseStackName(url);
        const title = this.getPageTitle();

        if (stackName && title && title !== stackName) {
            return prefixedTitle(`Spacelift: ${stackName}`, title, SpaceliftHandler.TOTAL_MAX_LEN);
        }
        if (stackName) {
            return `Spacelift Stack: ${stackName}`;
        }
        return 'Spacelift Stack';
    }
}
