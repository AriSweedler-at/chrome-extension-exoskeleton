import {ShowToastAction, type ShowToastPayload} from '@exo/lib/actions/show-toast.action';
import {theme} from '@exo/theme/default';

/**
 * Content script entry point
 */

// Auto-discover page-side tab modules (side-effect imports)
import.meta.glob('./exo-tabs/*/page.{ts,tsx}', {eager: true});

// Shared: ShowToast handler (not tab-specific)
ShowToastAction.handle(async (payload: ShowToastPayload) => {
    const {Notifications} = await import('@exo/lib/toast-notification');
    Notifications.show({
        message: payload.message,
        type: payload.type,
        children: payload.detail ? (
            <pre
                style={{
                    ...theme.toast.detail,
                    margin: '8px 0 0 0',
                    whiteSpace: 'pre',
                    lineHeight: '1.5',
                }}
            >
                {payload.detail}
            </pre>
        ) : undefined,
    });
});

console.log("Ari's chrome exoskeleton loaded");
