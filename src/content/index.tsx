import {IncrementAction} from '@actions/increment.action';
import {GetCountAction} from '@actions/get-count.action';
import {CopyRichLinkAction} from '@actions/copy-rich-link.action';
import {ExtractLogCommandAction} from '@actions/extract-log-command.action';
import {ShowToastAction, type ShowToastPayload} from '@actions/show-toast.action';
import {handleCopyRichLink} from '@library/richlink/content-handler';
import {handleExtractLogCommand} from '@library/opensearch/content-handler';
import {initializeGitHubAutoscroll} from '@library/github-autoscroll/content-integration';

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
    const {Notifications} = await import('@library/notifications');
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
