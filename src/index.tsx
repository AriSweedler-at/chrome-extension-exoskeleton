import {CopyRichLinkAction} from '@exo/lib/actions/copy-rich-link.action';
import {ExtractLogCommandAction} from '@exo/lib/actions/extract-log-command.action';
import {ShowToastAction, type ShowToastPayload} from '@exo/lib/actions/show-toast.action';
import {handleCopyRichLink} from '@exo/lib/richlink/content-handler';
import {handleExtractLogCommand} from '@exo/lib/opensearch/content-handler';
import {initializeGitHubAutoscroll} from '@exo/lib/github-autoscroll/content-integration';

/**
 * Content script entry point
 */

// --- Action handlers ---

CopyRichLinkAction.handle(handleCopyRichLink);
ExtractLogCommandAction.handle(handleExtractLogCommand);

ShowToastAction.handle(async (payload: ShowToastPayload) => {
    const {Notifications} = await import('@exo/lib/toast-notification');
    Notifications.show({
        message: payload.message,
        type: payload.type,
        detail: payload.detail,
    });
});

// --- Integrations ---

initializeGitHubAutoscroll();

console.log("Ari's chrome exoskeleton loaded");
