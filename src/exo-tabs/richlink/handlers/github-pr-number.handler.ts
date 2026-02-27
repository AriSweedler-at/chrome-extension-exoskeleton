import {type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';
import {GitHubHandler} from '@exo/exo-tabs/richlink/handlers/github.handler';

export class GitHubPrNumberHandler extends GitHubHandler {
    override getFormats(ctx: FormatContext): LinkFormat[] {
        const prNumber = this.parsePrNumber(ctx.url);
        const text = `#${prNumber}`;
        return [{label: 'GitHub PR #', priority: 300, html: text, text}];
    }
}
