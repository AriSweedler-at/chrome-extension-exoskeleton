import {CopyRichLinkAction} from '@exo/library/actions/copy-rich-link.action';
import {ExtractLogCommandAction} from '@exo/library/actions/extract-log-command.action';
import {ShowToastAction, type ShowToastPayload} from '@exo/library/actions/show-toast.action';
import {handleCopyRichLink} from '@exo/library/richlink/content-handler';
import {handleExtractLogCommand} from '@exo/library/opensearch/content-handler';
import {initializeGitHubAutoscroll} from '@exo/library/github-autoscroll/content-integration';

/**
 * Content script entry point
 */

// --- Action handlers ---

CopyRichLinkAction.handle(handleCopyRichLink);
ExtractLogCommandAction.handle(handleExtractLogCommand);

ShowToastAction.handle(async (payload: ShowToastPayload) => {
    const {Notifications} = await import('@exo/library/toast-notification');
    Notifications.show({
        message: payload.message,
        type: payload.type,
        detail: payload.detail,
    });
});

// --- Integrations ---

initializeGitHubAutoscroll();

console.log("Ari's chrome exoskeleton loaded");
