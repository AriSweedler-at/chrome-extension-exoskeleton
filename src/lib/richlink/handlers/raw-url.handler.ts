import {Handler} from '@exo/lib/richlink/base';

export class RawUrlHandler extends Handler {
    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    getLabel(): string {
        return 'Raw URL';
    }

    async getHtml(): Promise<string> {
        return window.location.href;
    }

    async getText(): Promise<string> {
        return window.location.href;
    }

    getPriority(): number {
        return 200;
    }

    isFallback(): boolean {
        return true;
    }
}
