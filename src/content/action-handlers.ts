import {IncrementAction} from '../actions/increment.action';
import {GetCountAction} from '../actions/get-count.action';
import {CopyRichLinkAction} from '../actions/copy-rich-link.action';
import {ExtractLogCommandAction} from '../actions/extract-log-command.action';
import {ShowToastAction, type ShowToastPayload} from '../actions/show-toast.action';
import {handleCopyRichLink} from './richlink-handler';
import {handleExtractLogCommand} from './opensearch-handler';

/**
 * Context state for this content script
 */
const context = {
    count: 0,
};

/**
 * Initialize all action handlers
 */
export function initializeActionHandlers(): void {
    // Register IncrementAction handler
    IncrementAction.setContext(context);
    IncrementAction.handle(
        async (
            payload: {amount: number},
            _sender: chrome.runtime.MessageSender,
            ctx: {count: number},
        ) => {
            ctx.count += payload.amount;

            // Broadcast count change to popup (if open)
            chrome.runtime.sendMessage({
                type: 'COUNT_UPDATED',
                count: ctx.count,
            }).catch(() => {
                // Popup might not be open, ignore error
            });

            return {count: ctx.count};
        },
    );

    // Register GetCountAction handler
    GetCountAction.setContext(context);
    GetCountAction.handle(
        async (
            _payload: void,
            _sender: chrome.runtime.MessageSender,
            ctx: {count: number},
        ) => {
            return {count: ctx.count};
        },
    );

    // Register CopyRichLinkAction handler
    CopyRichLinkAction.handle(handleCopyRichLink);

    // Register ExtractLogCommandAction handler
    ExtractLogCommandAction.handle(handleExtractLogCommand);

    // Register ShowToastAction handler
    ShowToastAction.handle(async (payload: ShowToastPayload) => {
        const {Notifications} = await import('@library/notifications');
        Notifications.show({
            message: payload.message,
            type: payload.type,
            detail: payload.detail,
        });
    });

    // Reset count on page load
    window.addEventListener('load', () => {
        context.count = 0;
    });
}
