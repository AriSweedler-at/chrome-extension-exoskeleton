import {type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';
import {GitHubHandler} from '@exo/exo-tabs/richlink/handlers/github.handler';

export class GitHubPrNumberHandler extends GitHubHandler {
    override getFormats(ctx: FormatContext): LinkFormat[] {
        const prNumber = this.parsePrNumber(ctx.url);
        const text = `#${prNumber}`;
        const url = ctx.url.split('/').slice(0, 7).join('/');
        return [{label: 'GitHub PR #', priority: 300, html: `<a href="${url}">${text}</a>`, text}];
    }
}
