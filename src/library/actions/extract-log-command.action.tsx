import {Action} from '@exo/library/actions/base-action';

export interface ExtractLogCommandResult {
    success: boolean;
    command?: string;
    error?: string;
}

export class ExtractLogCommandAction extends Action<void, ExtractLogCommandResult> {
    type = 'EXTRACT_LOG_COMMAND' as const;
}
