import {Action} from '@exo/library/actions/base-action';
import type {NotificationType} from '@exo/library/notifications';

export interface ShowToastPayload {
    message: string;
    type?: NotificationType;
    duration?: number;
    detail?: string;
}

export class ShowToastAction extends Action<ShowToastPayload, void> {
    type = 'SHOW_TOAST' as const;
}
