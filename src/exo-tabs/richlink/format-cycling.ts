const CACHE_KEY = 'richlink-last-copy';
export const CACHE_EXPIRY_MS = 3000;

/**
 * Get the next format index for cycling
 */
export function getNextFormatIndex(totalFormats: number): number {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) {
            return 0;
        }

        const data = JSON.parse(cached);
        const isExpired = Date.now() - data.timestamp > CACHE_EXPIRY_MS;

        if (isExpired) {
            localStorage.removeItem(CACHE_KEY);
            return 0;
        }

        // Cycle to next format
        const nextIndex = (data.formatIndex + 1) % totalFormats;
        return nextIndex;
    } catch {
        return 0;
    }
}

/**
 * Cache the format index for cycling
 */
export function cacheFormatIndex(formatIndex: number): void {
    const data = {
        timestamp: Date.now(),
        formatIndex,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

/**
 * Check if we're currently cycling (within 3s of previous copy)
 */
export function isCycling(): boolean {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return false;
        const data = JSON.parse(cached);
        return Date.now() - data.timestamp <= CACHE_EXPIRY_MS;
    } catch {
        return false;
    }
}
