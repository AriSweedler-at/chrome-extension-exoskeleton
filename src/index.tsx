import {ShowToastAction, showToastPayload} from '@exo/lib/actions/show-toast.action';
import {PrimaryActionAction} from '@exo/lib/actions/primary-action.action';
import {Notifications} from '@exo/lib/toast-notification';
import {keybindings} from '@exo/lib/keybindings';

/**
 * Content script entry point
 */

// The keybinding and toast libraries are standalone; this is where the app
// wires them together.
keybindings.setNotifier(Notifications);

// Auto-discover page-side tab modules (side-effect imports)
import.meta.glob('./exo-tabs/*/page.{ts,tsx}', {eager: true});

// Shared: ShowToast handler (not tab-specific)
ShowToastAction.handle(showToastPayload);

keybindings.registerAll([
    // The page's primary action, dispatched by the service worker (primary
    // actions need chrome.tabs APIs the content script doesn't have).
    {
        key: 'x',
        modifiers: {meta: true, shift: true},
        description: 'Primary action for this page',
        context: 'Global',
        handler: () => {
            PrimaryActionAction.send({url: window.location.href}).catch((err) =>
                console.error('[exo] primary action failed', err),
            );
        },
    },
    // Backspace stays free until a toast is on screen.
    {
        key: 'Backspace',
        description: 'Dismiss notifications',
        context: 'Global',
        when: () => Notifications.hasVisible(),
        silent: true,
        handler: () => Notifications.dismissAll(),
    },
]);
keybindings.listen();

console.log("Ari's chrome exoskeleton loaded");
