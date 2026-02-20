import {describe, it, expect, beforeEach} from 'vitest';
import {CopyCounter} from '@exo/lib/richlink/copy-counter';

describe('CopyCounter', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should start at 0', async () => {
        const count = await CopyCounter.getCount();
        expect(count).toBe(0);
    });

    it('should increment count', async () => {
        await CopyCounter.increment();
        const count = await CopyCounter.getCount();
        expect(count).toBe(1);

        await CopyCounter.increment();
        const count2 = await CopyCounter.getCount();
        expect(count2).toBe(2);
    });

    it('should persist across instances', async () => {
        await CopyCounter.increment();
        await CopyCounter.increment();

        const count = await CopyCounter.getCount();
        expect(count).toBe(2);
    });
});
