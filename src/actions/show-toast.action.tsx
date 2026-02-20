import {Action} from '@library/actions/base-action';

export interface ShowToastPayload {
    message: string;
    type: 'success' | 'error' | 'default';
    duration?: number;
    detail?: string;
}

export class ShowToastAction extends Action<ShowToastPayload, void> {
    type = 'SHOW_TOAST' as const;
}
