export interface LinkFormat {
    label: string; // Button text in the popup format picker: "GitHub PR", "Page Title", "Raw URL"
    priority: number; // Lower numbers appear first in the format picker
    isFallback?: boolean; // True for fallback formats (e.g. Page Title, Raw URL); used by UI for styling
    html: string; // HTML to copy: "<a href='...'>text</a>"
    text: string; // Plain text: "text (url)"
}

/**
 * Context passed to getFormats().
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
 * Base class for rich link handlers. Each handler knows how to produce
 * meaningful copy-paste formats for a particular class of URLs.
 *
 * A single handler can return multiple formats (e.g. the Airtable handler
 * returns both "Listable Record" and "Airtable Record" for Listable URLs).
 *
 * To add a new handler, create a `*.handler.ts` file in `handlers/` that
 * extends this class — it will be auto-discovered and registered.
 */
export abstract class Handler {
    /** Return true if this handler knows how to produce links for the given URL. */
    abstract canHandle(url: URL): boolean;

    /** Return one or more LinkFormats for the given URL. */
    abstract getFormats(ctx: FormatContext): LinkFormat[];

    /** True for fallback handlers (e.g. Page Title, Raw URL) that match all URLs. */
    readonly isFallback: boolean = false;
}
