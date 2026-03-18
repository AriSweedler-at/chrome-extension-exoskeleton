import {
    Handler,
    linkFormat,
    type FormatContext,
    type LinkFormat,
} from '@exo/exo-tabs/richlink/base';

export class PageTitleHandler extends Handler {
    canHandle(_url: URL): boolean {
        return true; // Handles all URLs as fallback
    }

    override readonly isFallback = true;

    getFormats(ctx: FormatContext): LinkFormat[] {
        return [linkFormat('Page Title', 100, document.title || 'Untitled', ctx.url, true)];
    }
}
