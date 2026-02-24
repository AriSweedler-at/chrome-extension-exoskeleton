const STORAGE_KEY = 'richlink-copy-count';

export class CopyCounter {
    static async getCount(): Promise<number> {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        return result[STORAGE_KEY] ?? 0;
    }

    static async increment(): Promise<number> {
        const count = await this.getCount();
        const newCount = count + 1;
        await chrome.storage.local.set({[STORAGE_KEY]: newCount});
        return newCount;
    }
}
