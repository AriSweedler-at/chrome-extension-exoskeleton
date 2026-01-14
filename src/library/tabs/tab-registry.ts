import {Component} from '../components/base-component';

export interface TabRegistration {
    id: string;
    label: string;
    component: typeof Component;
    getPriority: (url: string) => number;
}

export class TabRegistry {
    private static tabs: TabRegistration[] = [];

    static register(config: TabRegistration): void {
        if (this.tabs.some((t) => t.id === config.id)) {
            throw new Error(`Tab ID '${config.id}' already registered`);
        }
        this.tabs.push(config);
    }

    static getVisibleTabs(url: string): Array<TabRegistration & {priority: number}> {
        return this.tabs
            .map((tab) => ({...tab, priority: tab.getPriority(url)}))
            .filter((tab) => tab.priority !== Number.MAX_SAFE_INTEGER)
            .sort((a, b) => a.priority - b.priority);
    }

    /**
     * Clear all registered tabs (for testing only)
     * @internal
     */
    static clearForTesting(): void {
        this.tabs = [];
    }
}
