import {Commands} from '@exo/lib/service-worker/commands';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {CopyRichLinkAction} from '@exo/exo-tabs/richlink/action';

// Import tabs to trigger registration (side-effect imports)
import '@exo/exo-tabs';

/**
 * Initialize command handlers for keyboard shortcuts
 */
export function initializeCommandHandlers(): void {
    Commands.onCommand(async (command) => {
        console.log('Command received:', command);

        switch (command) {
            case 'copy-rich-link': {
                const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                if (!tab.id || !tab.url) return;
                await CopyRichLinkAction.sendToTab(tab.id, {url: tab.url});
                break;
            }
            case 'primary-action': {
                const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                if (!tab.id || !tab.url) return;
                await TabRegistry.dispatchPrimaryAction(tab.id, tab.url);
                break;
            }
        }
    });
}
