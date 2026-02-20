import {ShowToastAction, type ShowToastPayload} from '@exo/lib/actions/show-toast.action';

/**
 * Content script entry point
 */

// Auto-discover page-side tab modules (side-effect imports)
import.meta.glob('./exo-tabs/*/page.ts', {eager: true});

// Shared: ShowToast handler (not tab-specific)
ShowToastAction.handle(async (payload: ShowToastPayload) => {
    const {Notifications} = await import('@exo/lib/toast-notification');
    Notifications.show({
        message: payload.message,
        type: payload.type,
        detail: payload.detail,
    });
});

console.log("Ari's chrome exoskeleton loaded");
