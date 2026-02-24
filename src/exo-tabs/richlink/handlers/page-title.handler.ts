import {Handler} from '@exo/exo-tabs/richlink/base';

export class PageTitleHandler extends Handler {
    readonly label = 'Page Title';
    readonly priority = 100;

    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    extractTitle(): string {
        return document.title || 'Untitled';
    }

    isFallback(): boolean {
        return true;
    }
}
