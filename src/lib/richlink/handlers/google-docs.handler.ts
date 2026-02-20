import {Handler} from '@exo/lib/richlink/base';

export class GoogleDocsHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('docs.google.com');
    }

    getLabel(): string {
        return 'Google Doc';
    }

    async getHtml(): Promise<string> {
        const title = this.extractTitle();
        const url = window.location.href;
        return `<a href="${url}">${title}</a>`;
    }

    async getText(): Promise<string> {
        const title = this.extractTitle();
        const url = window.location.href;
        return `${title} (${url})`;
    }

    getPriority(): number {
        return 20;
    }

    private extractTitle(): string {
        // Google Docs uses an input element for the document title
        // TODO: Verify this selector works across all Google Docs pages (Docs, Sheets, Slides)
        const titleInput = document.querySelector('.docs-title-input') as HTMLInputElement;
        if (titleInput?.value) {
            return titleInput.value.trim();
        }

        // Alternative selector: Some pages use a span with data-tooltip="Rename"
        const titleSpan = document.querySelector('span[data-tooltip="Rename"]');
        if (titleSpan?.textContent) {
            return titleSpan.textContent.trim();
        }

        return 'Google Doc';
    }
}
