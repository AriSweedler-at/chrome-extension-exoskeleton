/**
 * Clouddev terminal page module.
 *
 * On matching pages, asks the service worker to set the terminal font in the
 * page's main world (content scripts can't access window.term directly).
 */
import {Notifications} from '@exo/lib/toast-notification';
import {isClouddevTermPage} from '@exo/exo-tabs/clouddev-term';

function autoApply(): void {
    if (!isClouddevTermPage(window.location.href)) return;

    setTimeout(async () => {
        try {
            const result = await chrome.runtime.sendMessage({type: 'CLOUDDEV_TERM_SET_FONT'});
            if (result?.applied) {
                Notifications.show({
                    message: `Terminal font set to CaskaydiaMono Nerd Font (was: ${result.previous})`,
                });
            }
        } catch (e) {
            console.warn('[clouddev-term] auto-apply failed:', e);
        }
    }, 2000);
}

// Self-register
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoApply);
} else {
    autoApply();
}
