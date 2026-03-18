import {type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';
import {GitHubHandler} from '@exo/exo-tabs/richlink/handlers/github.handler';

export class GitHubPrNumberHandler extends GitHubHandler {
    override readonly label = 'GitHub PR #';
    override readonly priority = 300;

    override extractLinkText({url}: FormatContext): string {
        return `#${this.parsePrNumber(url)}`;
    }

    /** Override: text is just #123 without the URL appended. */
    override getFormats(ctx: FormatContext): LinkFormat[] {
        const text = this.extractLinkText(ctx);
        const url = this.getUrl(ctx);
        return [
            {
                label: this.label,
                priority: this.priority,
                html: `<a href="${url}">${text}</a>`,
                text,
            },
        ];
    }
}
