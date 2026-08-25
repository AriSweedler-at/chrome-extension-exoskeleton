import {Action} from '@exo/lib/actions/base-action';

export interface PrimaryActionPayload {
    /** The sending page's URL at keypress time — fresher than sender.tab.url on SPAs. */
    url: string;
}

/**
 * Content-script → service-worker request to run the current page's primary
 * action (Cmd+Shift+X). Dispatch must happen in the service worker: primary
 * actions drive chrome.tabs APIs that content scripts don't have.
 */
export class PrimaryActionAction extends Action<PrimaryActionPayload, void> {
    type = 'PRIMARY_ACTION' as const;
}
