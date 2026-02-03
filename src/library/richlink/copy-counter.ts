const STORAGE_KEY = 'richlink-copy-count';

export class CopyCounter {
    static async getCount(): Promise<number> {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return 0;
        }
        try {
            const data = JSON.parse(stored);
            return data.count || 0;
        } catch {
            return 0;
        }
    }

    static async increment(): Promise<number> {
        const count = await this.getCount();
        const newCount = count + 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({count: newCount}));
        return newCount;
    }
}
