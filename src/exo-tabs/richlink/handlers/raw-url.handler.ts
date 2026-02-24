import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

export class RawUrlHandler extends Handler {
    readonly label = 'Raw URL';
    readonly priority = 200;
    override readonly isFallback = true;

    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    extractLinkText({url}: FormatContext): string {
        return url;
    }

    override getFormat(ctx: FormatContext): LinkFormat {
        const url = ctx.url;
        return {label: this.label, html: url, text: url};
    }
}
