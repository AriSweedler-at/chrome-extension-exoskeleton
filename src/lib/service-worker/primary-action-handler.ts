import {
    PrimaryActionAction,
    type PrimaryActionPayload,
} from '@exo/lib/actions/primary-action.action';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
// Import tabs to trigger registration (side-effect imports)
import '@exo/exo-tabs';

/**
 * Wire the content-script Cmd+Shift+X keystroke to the tab registry. The tab
 * id comes from the message sender — never from tabs.query, which can race a
 * focus change between keypress and dispatch.
 */
export function initializePrimaryActionHandler(): void {
    PrimaryActionAction.handle(async (payload: PrimaryActionPayload, sender) => {
        const tabId = sender.tab?.id;
        if (tabId === undefined) return;
        await TabRegistry.dispatchPrimaryAction(tabId, payload.url);
    });
}
