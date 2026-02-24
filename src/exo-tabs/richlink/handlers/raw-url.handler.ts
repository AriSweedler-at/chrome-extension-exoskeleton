import {Handler, LinkFormat} from '@exo/exo-tabs/richlink/base';

export class RawUrlHandler extends Handler {
    readonly label = 'Raw URL';
    readonly priority = 200;
    override readonly isFallback = true;

    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    extractTitle(): string {
        return window.location.href;
    }

    override getFormat(): LinkFormat {
        const url = window.location.href;
        return {label: this.label, html: url, text: url};
    }
}
