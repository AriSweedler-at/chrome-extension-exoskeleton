import {keybindings} from '@exo/lib/keybindings';
import {Notifications, NotificationType} from '@exo/lib/toast-notification';
import {isAirtableHost, parseShelfView, cameFromShelf} from '@exo/exo-tabs/airtable-shelf';

/**
 * 'i' (isolate): a record open as a shelf navigates to its fullscreen view.
 * Pure URL navigation — no state, no UI interaction. Guarded: the key only
 * intercepts while a shelf is actually open.
 */
export function isolateShelf(): void {
    const shelf = parseShelfView(window.location.href);
    if (!shelf) return; // unreachable via the when-guard; belt for direct calls
    window.location.href = shelf.fullscreenUrl;
}

/**
 * 'I' (undo the isolation): on the fullscreen view whose referrer is the
 * shelf it was isolated from, navigate back. Anywhere else, say why not.
 */
export function returnFromIsolation(): void {
    if (cameFromShelf(window.location.href, document.referrer)) {
        window.history.back();
        return;
    }

    Notifications.show({
        markdown: "Can't return to a shelf — this fullscreen view wasn't opened via isolate (`i`)",
        type: NotificationType.Error,
    });
}

function initialize(): void {
    if (!isAirtableHost(window.location.href)) return;

    keybindings.registerAll([
        {
            key: 'i',
            description: 'Isolate the record shelf to its fullscreen view',
            handler: isolateShelf,
            context: 'Airtable',
            when: () => parseShelfView(window.location.href) !== null,
        },
        {
            key: 'I',
            modifiers: {shift: true},
            description: 'Return from the isolated fullscreen view to its shelf',
            handler: returnFromIsolation,
            context: 'Airtable',
        },
    ]);
    keybindings.listen();
}

initialize();
