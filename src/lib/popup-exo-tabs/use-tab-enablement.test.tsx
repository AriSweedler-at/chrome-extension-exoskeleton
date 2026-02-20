import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor, act} from '@testing-library/react';
import {useTabEnablement} from '@exo/lib/popup-exo-tabs/use-tab-enablement';

describe('useTabEnablement', () => {
    beforeEach(() => {
        vi.stubGlobal('chrome', {
            storage: {
                local: {
                    get: vi.fn((_key, callback) => {
                        callback({});
                    }),
                    set: vi.fn((_, callback) => {
                        if (callback) callback();
                    }),
                },
            },
        });
    });

    it('defaults to enabled when no storage value exists', async () => {
        const {result} = renderHook(() => useTabEnablement('test-tab'));

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.enabled).toBe(true);
    });

    it('loads enabled state from storage', async () => {
        chrome.storage.local.get = vi.fn((_key, callback) => {
            callback({'exorun-test-tab': false});
        });

        const {result} = renderHook(() => useTabEnablement('test-tab'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.enabled).toBe(false);
    });

    it('updates enabled state in storage', async () => {
        const {result} = renderHook(() => useTabEnablement('test-tab'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.setEnabled(false);
        });

        expect(chrome.storage.local.set).toHaveBeenCalledWith(
            {'exorun-test-tab': false},
            expect.any(Function),
        );
        expect(result.current.enabled).toBe(false);
    });
});
