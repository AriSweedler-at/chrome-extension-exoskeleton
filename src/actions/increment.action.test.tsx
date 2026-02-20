import {describe, it, expect} from 'vitest';
import {IncrementAction} from '@exo/actions/increment.action';

describe('IncrementAction', () => {
    it('should have correct type', () => {
        const action = new IncrementAction();
        expect(action.type).toBe('INCREMENT');
    });

    it('should be instantiable', () => {
        const action = new IncrementAction();
        expect(action).toBeInstanceOf(IncrementAction);
    });
});
