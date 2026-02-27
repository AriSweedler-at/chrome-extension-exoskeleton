import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

export class RawUrlHandler extends Handler {
    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    override readonly isFallback = true;

    getFormats(ctx: FormatContext): LinkFormat[] {
        const url = ctx.url;
        return [{label: 'Raw URL', priority: 200, isFallback: true, html: url, text: url}];
    }
}
