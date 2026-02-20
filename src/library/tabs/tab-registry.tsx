import {ComponentType} from 'react';
import {ShowToastAction} from '../../actions/show-toast.action';
import {NotificationType} from '../notifications';

export interface TabRegistration {
    id: string;
    label: string;
    component: ComponentType;
    getPriority: (url: string) => number;
    primaryAction: (tabId: number, url: string) => Promise<boolean>;
    enablementToggle?: boolean;
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

    static async dispatchPrimaryAction(tabId: number, url: string): Promise<void> {
        const tabs = this.getVisibleTabs(url);
        const tried: string[] = [];

        for (const tab of tabs) {
            tried.push(tab.label);
            try {
                const handled = await tab.primaryAction(tabId, url);
                if (handled) return;
            } catch (e) {
                console.error(`Primary action failed for tab "${tab.label}":`, e);
            }
        }

        // All tabs tried, none handled it
        await ShowToastAction.sendToTab(tabId, {
            message: 'No primary action available',
            type: NotificationType.Error,
            detail: tried.length > 0
                ? `Tried: ${tried.join(', ')}`
                : 'No tabs matched this page',
        });
    }

    /**
     * Clear all registered tabs (for testing only)
     * @internal
     */
    static clearForTesting(): void {
        this.tabs = [];
    }
}
