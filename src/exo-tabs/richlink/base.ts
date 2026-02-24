export interface LinkFormat {
    label: string; // Display name: "GitHub PR", "Page Title", "Raw URL"
    html: string; // HTML to copy: "<a href='...'>text</a>"
    text: string; // Plain text: "text (url)"
}

/**
 * Base class for rich link handlers. Each handler knows how to produce a
 * meaningful copy-paste label for a particular class of URLs.
 *
 * To add a new handler, create a `*.handler.ts` file in `handlers/` that
 * extends this class — it will be auto-discovered and registered.
 */
export abstract class Handler {
    /** Return true if this handler knows how to produce a label for the given URL. */
    abstract canHandle(url: string): boolean;

    /** Short display name shown in the format picker (e.g. "GitHub PR", "Spacelift Stack"). */
    abstract getLabel(): string;

    /** Extract a human-readable title from the current page's DOM or URL. */
    abstract extractTitle(): string;

    /** Lower numbers appear first in the format picker. */
    abstract getPriority(): number;

    /** HTML format for rich-text paste: `<a href="...">title</a>`. Override for bespoke output. */
    async getHtml(): Promise<string> {
        const title = this.extractTitle();
        const url = window.location.href;
        return `<a href="${url}">${title}</a>`;
    }

    /** Plain-text format: `title (url)`. Override for bespoke output. */
    async getText(): Promise<string> {
        const title = this.extractTitle();
        const url = window.location.href;
        return `${title} (${url})`;
    }

    /** Bundle label + html + text into a single LinkFormat object. */
    async getFormat(): Promise<LinkFormat> {
        return {
            label: this.getLabel(),
            html: await this.getHtml(),
            text: await this.getText(),
        };
    }

    /** Return true for fallback handlers (e.g. Page Title, Raw URL) that match all URLs. */
    isFallback(): boolean {
        return false;
    }
}
