import {
    Handler,
    truncateWithEllipsis,
    type FormatContext,
    type LinkFormat,
} from '@exo/exo-tabs/richlink/base';
import {SPACELIFT_HOSTNAME} from '@exo/exo-tabs/spacelift';

export class SpaceliftHandler extends Handler {
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

    private extractLinkText(url: string): string {
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

    getFormats(ctx: FormatContext): LinkFormat[] {
        const title = this.extractLinkText(ctx.url);
        return [
            {
                label: 'Spacelift Stack',
                priority: 60,
                html: `<a href="${ctx.url}">${title}</a>`,
                text: `${title} (${ctx.url})`,
            },
        ];
    }
}
