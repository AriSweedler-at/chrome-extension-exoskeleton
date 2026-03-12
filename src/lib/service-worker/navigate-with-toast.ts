import {ShowToastAction, type ShowToastPayload} from '@exo/lib/actions/show-toast.action';

export interface NavigateWithToastPayload {
    tabId: number;
    url: string;
    toast: ShowToastPayload;
}

/** Retry sending the toast until the content script is ready (up to ~2s). */
async function sendToastWithRetry(tabId: number, toast: ShowToastPayload): Promise<void> {
    for (let attempt = 0; attempt < 10; attempt++) {
        try {
            await ShowToastAction.sendToTab(tabId, toast);
            return;
        } catch {
            await new Promise((r) => setTimeout(r, 200));
        }
    }
}

/** Navigate a tab and show a toast after the new page loads. */
export async function navigateAndToast(
    tabId: number,
    url: string,
    toast: ShowToastPayload,
): Promise<void> {
    const onUpdated = (updatedId: number, info: chrome.tabs.TabChangeInfo) => {
        if (updatedId !== tabId || info.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(onUpdated);
        sendToastWithRetry(tabId, toast);
    };

    chrome.tabs.onUpdated.addListener(onUpdated);
    await chrome.tabs.update(tabId, {url});
}

/** Register a service-worker message handler for NAVIGATE_WITH_TOAST. */
export function initNavigateWithToast(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type !== 'NAVIGATE_WITH_TOAST') return false;

        const {url, toast} = message.payload as NavigateWithToastPayload;
        let {tabId} = message.payload as NavigateWithToastPayload;

        (async () => {
            if (tabId === -1) {
                const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                if (!tab?.id) return;
                tabId = tab.id;
            }
            await navigateAndToast(tabId, url, toast);
            sendResponse(true);
        })();

        return true;
    });
}
