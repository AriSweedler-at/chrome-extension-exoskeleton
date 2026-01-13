import {Action} from '@library/actions/base-action';

export class GetCountAction extends Action<void, {count: number}> {
    type = 'GET_COUNT' as const;
}

