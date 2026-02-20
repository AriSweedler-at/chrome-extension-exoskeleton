import {Handler} from '@exo/library/richlink/base';

export class PageTitleHandler extends Handler {
    canHandle(_url: string): boolean {
        return true; // Handles all URLs as fallback
    }

    getLabel(): string {
        return 'Page Title';
    }

    async getHtml(): Promise<string> {
        const title = document.title || 'Untitled';
        const url = window.location.href;
        return `<a href="${url}">${title}</a>`;
    }

    async getText(): Promise<string> {
        const title = document.title || 'Untitled';
        const url = window.location.href;
        return `${title} (${url})`;
    }

    getPriority(): number {
        return 100;
    }

    isFallback(): boolean {
        return true;
    }
}
