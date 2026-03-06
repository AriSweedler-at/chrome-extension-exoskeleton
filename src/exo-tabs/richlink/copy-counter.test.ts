import {describe, it, expect, beforeEach, vi} from 'vitest';
import {CopyCounter} from '@exo/exo-tabs/richlink/copy-counter';

describe('CopyCounter', () => {
    let storage: Record<string, unknown>;

    beforeEach(() => {
        storage = {};
        vi.stubGlobal('chrome', {
            storage: {
                local: {
                    get: vi.fn((key: string) => {
                        return Promise.resolve({[key]: storage[key]});
                    }),
                    set: vi.fn((obj: Record<string, unknown>) => {
                        Object.assign(storage, obj);
                        return Promise.resolve();
                    }),
                },
            },
        });
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
