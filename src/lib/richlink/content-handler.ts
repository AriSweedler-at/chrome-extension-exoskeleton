import {CopyRichLinkPayload} from '@exo/lib/actions/copy-rich-link.action';
import {HandlerRegistry} from '@exo/lib/richlink/handlers';
import {Clipboard} from '@exo/lib/clipboard';
import {Notifications} from '@exo/lib/toast-notification';
import {CopyCounter} from '@exo/lib/richlink/copy-counter';

const CACHE_KEY = 'richlink-last-copy';
const CACHE_EXPIRY_MS = 3000;

/**
 * Get the next format index for cycling
 */
function getNextFormatIndex(totalFormats: number): number {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) {
            return 0;
        }

        const data = JSON.parse(cached);
        const isExpired = Date.now() - data.timestamp > CACHE_EXPIRY_MS;

        if (isExpired) {
            localStorage.removeItem(CACHE_KEY);
            return 0;
        }

        // Cycle to next format
        const nextIndex = (data.formatIndex + 1) % totalFormats;
        return nextIndex;
    } catch {
        return 0;
    }
}

/**
 * Cache the format index for cycling
 */
function cacheFormatIndex(formatIndex: number): void {
    const data = {
        timestamp: Date.now(),
        formatIndex,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

/**
 * Check if we're currently cycling (within 3s of previous copy)
 */
function isCycling(): boolean {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return false;
        const data = JSON.parse(cached);
        return Date.now() - data.timestamp <= CACHE_EXPIRY_MS;
    } catch {
        return false;
    }
}

/**
 * Handle the CopyRichLink action
 */
export async function handleCopyRichLink(
    payload: CopyRichLinkPayload,
    _sender: chrome.runtime.MessageSender,
    _context: any,
) {
    const formats = await HandlerRegistry.getAllFormats(payload.url);
    const cycling = isCycling();

    // Get format index
    let formatIndex: number;
    if (payload.formatLabel) {
        // Find format by label
        formatIndex = formats.findIndex((f) => f.label === payload.formatLabel);
        if (formatIndex === -1) {
            formatIndex = 0; // Fallback to first format if not found
        }
    } else if (payload.formatIndex !== undefined) {
        formatIndex = payload.formatIndex;
    } else {
        formatIndex = getNextFormatIndex(formats.length);
    }

    const format = formats[formatIndex];

    // Copy to clipboard
    await Clipboard.write(format.text, format.html);

    // Only increment counter on first copy (not when cycling)
    if (!cycling) {
        await CopyCounter.increment();
    }

    // Build preview of next cycles (show next 2-3 formats)
    const nextFormats: string[] = [];
    if (formats.length > 1) {
        for (let i = 1; i <= Math.min(3, formats.length - 1); i++) {
            const nextIndex = (formatIndex + i) % formats.length;
            nextFormats.push(formats[nextIndex].label);
        }
    }
    const preview = nextFormats.length > 0 ? `Next: ${nextFormats.join(' → ')}` : undefined;

    // Determine if this is a fallback handler (PageTitle or RawURL)
    const isFallback = format.label === 'Page Title' || format.label === 'Raw URL';
    const opacity = isFallback ? 0.75 : 1;

    // Show notification with format indicator
    const formatInfo = formats.length > 1 ? ` [${formatIndex + 1}/${formats.length}]` : '';
    const message = `Copied${formatInfo}\n${format.label}`;

    Notifications.show({
        message,
        duration: CACHE_EXPIRY_MS,
        replace: cycling,
        opacity,
        preview,
    });

    // Cache format index for cycling
    if (payload.formatIndex === undefined) {
        cacheFormatIndex(formatIndex);
    }

    return {success: true, formatIndex, totalFormats: formats.length};
}
