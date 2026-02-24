export interface LinkFormat {
    label: string; // Button text in the popup format picker: "GitHub PR", "Page Title", "Raw URL"
    html: string; // HTML to copy: "<a href='...'>text</a>"
    text: string; // Plain text: "text (url)"
}

/**
 * Context passed to extractLinkText() and getFormat().
 *
 * Handlers run in two contexts: the page (content script) and the popup.
 * In the popup, `window.location.href` is the popup's chrome-extension://
 * URL — not the tab URL the user is looking at. This context object carries
 * the real tab URL so handlers never need to read window.location.
 */
export interface FormatContext {
    url: string;
}

/**
 * Base class for rich link handlers. Each handler knows how to produce a
 * meaningful copy-paste label for a particular class of URLs.
 *
 * To add a new handler, create a `*.handler.ts` file in `handlers/` that
 * extends this class — it will be auto-discovered and registered.
 */
export abstract class Handler {
    /** Button text in the popup format picker (e.g. "GitHub PR", "Spacelift Stack"). */
    abstract readonly label: string;

    /** Lower numbers appear first in the format picker. */
    abstract readonly priority: number;

    /** Return true if this handler knows how to produce a link for the given URL. */
    abstract canHandle(url: string): boolean;

    /** The text that appears inside the copied link: `<a href="...">linkText</a>`. */
    abstract extractLinkText(ctx: FormatContext): string;

    /** True for fallback handlers (e.g. Page Title, Raw URL) that match all URLs. */
    readonly isFallback: boolean = false;

    /** Build the LinkFormat for this handler. Override for bespoke output (e.g. RawUrl). */
    getFormat(ctx: FormatContext): LinkFormat {
        const title = this.extractLinkText(ctx);
        return {
            label: this.label,
            html: `<a href="${ctx.url}">${title}</a>`,
            text: `${title} (${ctx.url})`,
        };
    }
}
