import {Handler, type FormatContext, type LinkFormat} from '@exo/exo-tabs/richlink/base';

export class GoogleDocsHandler extends Handler {
    canHandle(url: string): boolean {
        try {
            return new URL(url).hostname === 'docs.google.com';
        } catch {
            return false;
        }
    }

    private extractLinkText(): string {
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

    getFormats(ctx: FormatContext): LinkFormat[] {
        const title = this.extractLinkText();
        return [
            {
                label: 'Google Doc',
                priority: 20,
                html: `<a href="${ctx.url}">${title}</a>`,
                text: `${title} (${ctx.url})`,
            },
        ];
    }
}
