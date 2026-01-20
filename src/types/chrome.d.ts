// Augment Chrome types to include experimental split screen API
declare namespace chrome.tabs {
    interface SplitOptions {
        tabId: number;
        newTabUrl: string;
    }

    function split(options: SplitOptions): Promise<void>;
}
