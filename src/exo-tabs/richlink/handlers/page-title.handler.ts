import {Handler, type FormatContext} from '@exo/exo-tabs/richlink/base';

export class PageTitleHandler extends Handler {
    readonly label = 'Page Title';
    readonly priority = 100;

    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    extractLinkText(_ctx: FormatContext): string {
        return document.title || 'Untitled';
    }

    override readonly isFallback = true;
}
