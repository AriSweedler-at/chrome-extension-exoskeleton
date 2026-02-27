import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

export class PageTitleHandler extends Handler {
    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    override readonly isFallback = true;

    getFormats(ctx: FormatContext): LinkFormat[] {
        const title = document.title || 'Untitled';
        return [
            {
                label: 'Page Title',
                priority: 100,
                isFallback: true,
                html: `<a href="${ctx.url}">${title}</a>`,
                text: `${title} (${ctx.url})`,
            },
        ];
    }
}
