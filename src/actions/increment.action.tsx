import {Action} from '@exo/library/actions/base-action';

export class IncrementAction extends Action<{amount: number}, {count: number}> {
    type = 'INCREMENT' as const;
}
