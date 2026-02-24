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
    /** Short display name shown in the format picker (e.g. "GitHub PR", "Spacelift Stack"). */
    abstract readonly label: string;

    /** Lower numbers appear first in the format picker. */
    abstract readonly priority: number;

    /** Return true if this handler knows how to produce a label for the given URL. */
    abstract canHandle(url: string): boolean;

    /** Extract a human-readable title from the current page's DOM or URL. */
    abstract extractTitle(): string;

    /** True for fallback handlers (e.g. Page Title, Raw URL) that match all URLs. */
    readonly isFallback: boolean = false;

    /** Build the LinkFormat for this handler. Override for bespoke output (e.g. RawUrl). */
    getFormat(): LinkFormat {
        const title = this.extractTitle();
        const url = window.location.href;
        return {
            label: this.label,
            html: `<a href="${url}">${title}</a>`,
            text: `${title} (${url})`,
        };
    }
}
