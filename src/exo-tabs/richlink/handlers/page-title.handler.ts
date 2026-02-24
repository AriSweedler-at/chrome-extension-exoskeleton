import {Handler} from '@exo/exo-tabs/richlink/base';

export class PageTitleHandler extends Handler {
    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    getLabel(): string {
        return 'Page Title';
    }

    extractTitle(): string {
        return document.title || 'Untitled';
    }

    getPriority(): number {
        return 100;
    }

    isFallback(): boolean {
        return true;
    }
}
