import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import {
    getNextFormatIndex,
    cacheFormatIndex,
    isCycling,
    CACHE_EXPIRY_MS,
} from '@exo/exo-tabs/richlink/format-cycling';

describe('format-cycling', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getNextFormatIndex', () => {
        it('returns 0 when no cache exists', () => {
            expect(getNextFormatIndex(3)).toBe(0);
        });

        it('cycles to next format when cache is fresh', () => {
            cacheFormatIndex(0);
            expect(getNextFormatIndex(3)).toBe(1);
        });

        it('wraps around to 0 at the end', () => {
            cacheFormatIndex(2);
            expect(getNextFormatIndex(3)).toBe(0);
        });

        it('returns 0 when cache is expired', () => {
            cacheFormatIndex(1);
            vi.advanceTimersByTime(CACHE_EXPIRY_MS + 1);
            expect(getNextFormatIndex(3)).toBe(0);
        });

        it('returns 0 on malformed JSON in localStorage', () => {
            localStorage.setItem('richlink-last-copy', 'not-json');
            expect(getNextFormatIndex(3)).toBe(0);
        });
    });

    describe('cacheFormatIndex', () => {
        it('stores format index in localStorage', () => {
            cacheFormatIndex(2);
            const stored = JSON.parse(localStorage.getItem('richlink-last-copy')!);
            expect(stored.formatIndex).toBe(2);
            expect(stored.timestamp).toBeTypeOf('number');
        });
    });

    describe('isCycling', () => {
        it('returns false when no cache exists', () => {
            expect(isCycling()).toBe(false);
        });

        it('returns true when cache is fresh', () => {
            cacheFormatIndex(0);
            expect(isCycling()).toBe(true);
        });

        it('returns false after expiry', () => {
            cacheFormatIndex(0);
            vi.advanceTimersByTime(CACHE_EXPIRY_MS + 1);
            expect(isCycling()).toBe(false);
        });

        it('returns false on malformed JSON', () => {
            localStorage.setItem('richlink-last-copy', '{bad');
            expect(isCycling()).toBe(false);
        });
    });
});
