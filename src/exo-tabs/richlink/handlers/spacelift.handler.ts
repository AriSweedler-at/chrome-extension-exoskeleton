import {Handler, truncateWithEllipsis, type FormatContext} from '@exo/exo-tabs/richlink/base';
import {SPACELIFT_HOSTNAME} from '@exo/exo-tabs/spacelift';

export class SpaceliftHandler extends Handler {
    readonly label = 'Spacelift Stack';
    readonly priority = 60;

    canHandle(url: URL): boolean {
        return url.hostname === SPACELIFT_HOSTNAME;
    }

    static readonly TOTAL_MAX_LEN = 60;

    private parseStackName(url: string): string | undefined {
        const match = new URL(url).pathname.match(/^\/stack\/([^/]+)/);
        return match?.[1];
    }

    private getPageTitle(): string | undefined {
        for (const selector of ['.run-title', '.stack-name', 'h1']) {
            const el = document.querySelector(selector);
            if (el?.textContent) return el.textContent.trim();
        }
        return undefined;
    }

    extractLinkText({url}: FormatContext): string {
        const stackName = this.parseStackName(url);
        const title = this.getPageTitle();

        if (stackName && title && title !== stackName) {
            const prefix = `Spacelift: ${stackName}: `;
            const remaining = SpaceliftHandler.TOTAL_MAX_LEN - prefix.length;
            const truncatedTitle = remaining >= 4 ? truncateWithEllipsis(title, remaining) : title;
            return prefix + truncatedTitle;
        }
        if (stackName) {
            return `Spacelift Stack: ${stackName}`;
        }
        return 'Spacelift Stack';
    }
}
