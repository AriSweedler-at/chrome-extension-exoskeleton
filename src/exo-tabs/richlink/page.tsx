import {
    CopyRichLinkAction,
    GetFormatsAction,
    type CopyRichLinkPayload,
    type GetFormatsPayload,
} from '@exo/exo-tabs/richlink/action';
import {HandlerRegistry} from '@exo/exo-tabs/richlink/handlers';
import {Clipboard} from '@exo/lib/clipboard';
import {Notifications} from '@exo/lib/toast-notification';
import {CopyCounter} from '@exo/exo-tabs/richlink/copy-counter';
import {
    CACHE_EXPIRY_MS,
    getNextFormatIndex,
    cacheFormatIndex,
    isCycling,
} from '@exo/exo-tabs/richlink/format-cycling';
import {theme} from '@exo/theme/default';

export async function handleCopyRichLink(
    payload: CopyRichLinkPayload,
    _sender: chrome.runtime.MessageSender,
    _context: void,
) {
    const formats = HandlerRegistry.getAllFormats(payload.url);
    const cycling = isCycling();

    // Get format index
    let formatIndex: number;
    if (payload.formatLabel) {
        formatIndex = formats.findIndex((f) => f.label === payload.formatLabel);
        if (formatIndex === -1) {
            formatIndex = 0;
        }
    } else if (payload.formatIndex !== undefined) {
        formatIndex = payload.formatIndex;
    } else {
        formatIndex = getNextFormatIndex(formats.length);
    }

    const format = formats[formatIndex];

    await Clipboard.write(format.text, format.html);

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
    const preview = nextFormats.length > 0 ? `Next: ${nextFormats.join(' \u2192 ')}` : undefined;

    const isFallback = format.label === 'Page Title' || format.label === 'Raw URL';
    const opacity = isFallback ? 0.9 : 1;

    const formatInfo = formats.length > 1 ? ` [${formatIndex + 1}/${formats.length}]` : '';
    const message = `Copied${formatInfo}\n${format.label}`;

    Notifications.show({
        message,
        duration: CACHE_EXPIRY_MS,
        replace: cycling,
        opacity,
        children: preview ? (
            <div style={{...theme.toast.preview, marginTop: '4px'}}>{preview}</div>
        ) : undefined,
    });

    if (payload.formatIndex === undefined) {
        cacheFormatIndex(formatIndex);
    }

    return {success: true, formatIndex, totalFormats: formats.length};
}

function handleGetFormats(payload: GetFormatsPayload) {
    return HandlerRegistry.getAllFormats(payload.url);
}

// Self-register: importing this module wires the handlers
CopyRichLinkAction.handle(handleCopyRichLink);
GetFormatsAction.handle(handleGetFormats);
