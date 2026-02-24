import {Handler} from '@exo/exo-tabs/richlink/base';

export class RawUrlHandler extends Handler {
    readonly label = 'Raw URL';
    readonly priority = 200;

    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    extractTitle(): string {
        return window.location.href;
    }

    async getHtml(): Promise<string> {
        return window.location.href;
    }

    async getText(): Promise<string> {
        return window.location.href;
    }

    isFallback(): boolean {
        return true;
    }
}
