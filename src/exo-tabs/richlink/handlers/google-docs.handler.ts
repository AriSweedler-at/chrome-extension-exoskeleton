import {Handler} from '@exo/exo-tabs/richlink/base';

export class GoogleDocsHandler extends Handler {
    canHandle(url: string): boolean {
        return url.includes('docs.google.com');
    }

    getLabel(): string {
        return 'Google Doc';
    }

    getPriority(): number {
        return 20;
    }

    extractTitle(): string {
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
