import {IncrementAction} from '@exo/actions/increment.action';
import {GetCountAction} from '@exo/actions/get-count.action';
import {CopyRichLinkAction} from '@exo/actions/copy-rich-link.action';
import {ExtractLogCommandAction} from '@exo/actions/extract-log-command.action';
import {ShowToastAction, type ShowToastPayload} from '@exo/actions/show-toast.action';
import {handleCopyRichLink} from '@exo/library/richlink/content-handler';
import {handleExtractLogCommand} from '@exo/library/opensearch/content-handler';
import {initializeGitHubAutoscroll} from '@exo/library/github-autoscroll/content-integration';

/**
 * Content script entry point
 */

const context = {count: 0};

// --- Action handlers ---

IncrementAction.setContext(context);
IncrementAction.handle(
    async (
        payload: {amount: number},
        _sender: chrome.runtime.MessageSender,
        ctx: {count: number},
    ) => {
        ctx.count += payload.amount;
        chrome.runtime.sendMessage({type: 'COUNT_UPDATED', count: ctx.count}).catch(() => {});
        return {count: ctx.count};
    },
);

GetCountAction.setContext(context);
GetCountAction.handle(
    async (_payload: void, _sender: chrome.runtime.MessageSender, ctx: {count: number}) => {
        return {count: ctx.count};
    },
);

CopyRichLinkAction.handle(handleCopyRichLink);
ExtractLogCommandAction.handle(handleExtractLogCommand);

ShowToastAction.handle(async (payload: ShowToastPayload) => {
    const {Notifications} = await import('@exo/library/notifications');
    Notifications.show({
        message: payload.message,
        type: payload.type,
        detail: payload.detail,
    });
});

window.addEventListener('load', () => {
    context.count = 0;
});

// --- Integrations ---

initializeGitHubAutoscroll();

console.log('Chrome Extension Starter: Content script loaded');
