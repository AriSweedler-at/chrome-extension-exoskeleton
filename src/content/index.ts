import {IncrementAction} from '../actions/increment.action';
import {GetCountAction} from '../actions/get-count.action';

// Context state for this content script
const context = {
    count: 0,
};

// Register action handlers with context
IncrementAction.setContext(context);
IncrementAction.handle(
    async (
        payload: {amount: number},
        _sender: chrome.runtime.MessageSender,
        ctx: {count: number},
    ) => {
        ctx.count += payload.amount;
        return {count: ctx.count};
    },
);

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

// Reset count on page load
window.addEventListener('load', () => {
    context.count = 0;
});

console.log('Chrome Extension Starter: Content script loaded');
