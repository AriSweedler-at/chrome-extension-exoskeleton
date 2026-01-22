import {describe, it, expect} from 'vitest';
import {GetCountAction} from '../../../src/actions/get-count.action';

describe('GetCountAction', () => {
    it('should have correct type', () => {
        const action = new GetCountAction();
        expect(action.type).toBe('GET_COUNT');
    });

    it('should be instantiable', () => {
        const action = new GetCountAction();
        expect(action).toBeInstanceOf(GetCountAction);
    });
});
