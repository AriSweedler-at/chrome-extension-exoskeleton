import {type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';
import {GitHubHandler} from '@exo/exo-tabs/richlink/handlers/github.handler';

export class GitHubPrNumberHandler extends GitHubHandler {
    override readonly label = 'GitHub PR #';
    override readonly priority = 300;

    override extractLinkText({url}: FormatContext): string {
        // Just the PR number — e.g. "#1234"
        const prNumber = this.parsePrNumber(url);
        return `#${prNumber}`;
    }

    override getFormat(ctx: FormatContext): LinkFormat {
        const text = this.extractLinkText(ctx);
        return {label: this.label, html: text, text};
    }
}
