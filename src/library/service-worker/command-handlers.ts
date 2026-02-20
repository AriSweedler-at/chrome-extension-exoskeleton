import {Commands} from '@exo/library/service-worker/commands';
import {TabRegistry} from '@exo/library/popup-exo-tabs/tab-registry';

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
                // Rich link copy is always the richlink tab's primary action
                const richlink = TabRegistry.getVisibleTabs(tab.url).find(
                    (t) => t.id === 'richlink',
                );
                if (richlink) {
                    await richlink.primaryAction(tab.id, tab.url);
                }
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
