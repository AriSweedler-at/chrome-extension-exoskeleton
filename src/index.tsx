import {ShowToastAction, type ShowToastPayload} from '@exo/lib/actions/show-toast.action';

/**
 * Content script entry point
 */

// Auto-discover page-side tab modules (side-effect imports)
import.meta.glob('./exo-tabs/*/page.{ts,tsx}', {eager: true});

// Shared: ShowToast handler (not tab-specific)
ShowToastAction.handle(async (payload: ShowToastPayload) => {
    const {Notifications} = await import('@exo/lib/toast-notification');
    Notifications.showPayload(payload);
});

console.log("Ari's chrome exoskeleton loaded");
